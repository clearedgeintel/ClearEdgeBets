/**
 * Social Routes
 * Groups CRUD + join/leave/invite, Friend Invitations CRUD, Friends list/delete
 */

import { Router } from 'express';
import { storage } from '../storage';

const router = Router();

// ── Groups ──────────────────────────────────────────────────────────────

router.post("/groups", async (req, res) => {
  try {
    const userId = (req.session as any)?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const { name, description, isPrivate, maxMembers } = req.body;
    if (!name) {
      return res.status(400).json({ error: "Group name is required" });
    }

    const group = await storage.createGroup({
      name,
      description,
      createdBy: userId,
      isPrivate: isPrivate || false,
      maxMembers: maxMembers || 50,
      currentMembers: 1
    });

    res.json(group);
  } catch (error) {
    console.error("Error creating group:", error);
    res.status(500).json({ error: "Failed to create group" });
  }
});

router.get("/groups", async (req, res) => {
  try {
    const userId = (req.session as any)?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const groups = await storage.getUserGroups(userId);
    res.json(groups);
  } catch (error) {
    console.error("Error fetching user groups:", error);
    res.status(500).json({ error: "Failed to fetch groups" });
  }
});

router.get("/groups/all", async (req, res) => {
  try {
    const groups = await storage.getAllGroups();
    res.json(groups);
  } catch (error) {
    console.error("Error fetching all groups:", error);
    res.status(500).json({ error: "Failed to fetch all groups" });
  }
});

router.get("/groups/:groupId", async (req, res) => {
  try {
    const { groupId } = req.params;
    const group = await storage.getGroup(Number(groupId));

    if (!group) {
      return res.status(404).json({ error: "Group not found" });
    }

    res.json(group);
  } catch (error) {
    console.error("Error fetching group:", error);
    res.status(500).json({ error: "Failed to fetch group" });
  }
});

router.get("/groups/:groupId/members", async (req, res) => {
  try {
    const { groupId } = req.params;
    const members = await storage.getGroupMembers(Number(groupId));
    res.json(members);
  } catch (error) {
    console.error("Error fetching group members:", error);
    res.status(500).json({ error: "Failed to fetch group members" });
  }
});

// Join a group by invite code (no membership needed — this is how new members get in)
router.post("/groups/join-by-code", async (req, res) => {
  try {
    const userId = (req.session as any)?.userId;
    if (!userId) return res.status(401).json({ error: "Not authenticated" });

    const code = (req.body?.inviteCode || "").trim().toUpperCase();
    if (!code) return res.status(400).json({ error: "Invite code is required" });

    const all = await storage.getAllGroups();
    const group = all.find((g) => (g.inviteCode || "").toUpperCase() === code);
    if (!group) return res.status(404).json({ error: "Invalid invite code" });

    const existing = await storage.getUserGroupRole(group.id, userId);
    if (existing) return res.status(400).json({ error: "Already a member of this group" });

    const membership = await storage.addGroupMember(group.id, userId);
    res.json({ group, membership });
  } catch (error) {
    console.error("Error joining by code:", error);
    res.status(500).json({ error: "Failed to join group" });
  }
});

router.post("/groups/:groupId/join", async (req, res) => {
  try {
    const userId = (req.session as any)?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const { groupId } = req.params;
    const { inviteCode } = req.body;

    // Verify invite code if provided
    if (inviteCode) {
      const group = await storage.getGroup(Number(groupId));
      if (!group || group.inviteCode !== inviteCode) {
        return res.status(400).json({ error: "Invalid invite code" });
      }
    }

    const membership = await storage.addGroupMember(Number(groupId), userId);
    res.json(membership);
  } catch (error) {
    console.error("Error joining group:", error);
    res.status(500).json({ error: "Failed to join group" });
  }
});

router.post("/groups/:groupId/leave", async (req, res) => {
  try {
    const userId = (req.session as any)?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const { groupId } = req.params;
    await storage.removeGroupMember(Number(groupId), userId);
    res.json({ success: true });
  } catch (error) {
    console.error("Error leaving group:", error);
    res.status(500).json({ error: "Failed to leave group" });
  }
});

router.post("/groups/:groupId/invite-code", async (req, res) => {
  try {
    const userId = (req.session as any)?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const { groupId } = req.params;

    // Check if user is admin of the group
    const userRole = await storage.getUserGroupRole(Number(groupId), userId);
    if (!userRole || userRole.role !== 'admin') {
      return res.status(403).json({ error: "Admin access required" });
    }

    const inviteCode = await storage.generateGroupInviteCode(Number(groupId));
    res.json({ inviteCode });
  } catch (error) {
    console.error("Error generating invite code:", error);
    res.status(500).json({ error: "Failed to generate invite code" });
  }
});

// ── Friend Invitations ──────────────────────────────────────────────────

router.post("/friend-invitations", async (req, res) => {
  try {
    const userId = (req.session as any)?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const { recipientEmail, groupId, message } = req.body;
    if (!recipientEmail) {
      return res.status(400).json({ error: "Recipient email is required" });
    }

    const invitation = await storage.createFriendInvitation({
      senderId: userId,
      recipientEmail,
      groupId: groupId || null,
      message: message || null
    });

    res.json(invitation);
  } catch (error) {
    console.error("Error creating friend invitation:", error);
    res.status(500).json({ error: "Failed to create friend invitation" });
  }
});

router.get("/friend-invitations", async (req, res) => {
  try {
    const userId = (req.session as any)?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const { status } = req.query;
    const invitations = await storage.getUserFriendInvitations(userId, status as string);
    res.json(invitations);
  } catch (error) {
    console.error("Error fetching friend invitations:", error);
    res.status(500).json({ error: "Failed to fetch friend invitations" });
  }
});

router.post("/friend-invitations/:invitationId/accept", async (req, res) => {
  try {
    const userId = (req.session as any)?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const { invitationId } = req.params;
    const friendship = await storage.acceptFriendInvitation(Number(invitationId));
    res.json(friendship);
  } catch (error) {
    console.error("Error accepting friend invitation:", error);
    res.status(500).json({ error: "Failed to accept friend invitation" });
  }
});

router.post("/friend-invitations/:invitationId/decline", async (req, res) => {
  try {
    const userId = (req.session as any)?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const { invitationId } = req.params;
    const invitation = await storage.updateFriendInvitationStatus(Number(invitationId), 'declined');
    res.json(invitation);
  } catch (error) {
    console.error("Error declining friend invitation:", error);
    res.status(500).json({ error: "Failed to decline friend invitation" });
  }
});

// ── Friends ─────────────────────────────────────────────────────────────

router.get("/friends", async (req, res) => {
  try {
    const userId = (req.session as any)?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const friends = await storage.getUserFriends(userId);
    res.json(friends);
  } catch (error) {
    console.error("Error fetching friends:", error);
    res.status(500).json({ error: "Failed to fetch friends" });
  }
});

router.delete("/friends/:friendId", async (req, res) => {
  try {
    const userId = (req.session as any)?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const { friendId } = req.params;
    await storage.deleteFriendship(userId, Number(friendId));
    res.json({ success: true });
  } catch (error) {
    console.error("Error removing friend:", error);
    res.status(500).json({ error: "Failed to remove friend" });
  }
});

export default router;
