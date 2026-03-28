CREATE TABLE "ai_summaries" (
	"id" serial PRIMARY KEY NOT NULL,
	"game_id" text NOT NULL,
	"summary" text NOT NULL,
	"confidence" integer NOT NULL,
	"value_plays" jsonb,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"action" text NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" text,
	"old_values" jsonb,
	"new_values" jsonb,
	"ip_address" text,
	"user_agent" text,
	"session_id" text,
	"severity" text DEFAULT 'info',
	"description" text NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "bankroll_snapshots" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"snapshot_date" date NOT NULL,
	"starting_balance" integer NOT NULL,
	"ending_balance" integer NOT NULL,
	"total_wagered" integer DEFAULT 0,
	"total_won" integer DEFAULT 0,
	"total_lost" integer DEFAULT 0,
	"bets_placed" integer DEFAULT 0,
	"bets_won" integer DEFAULT 0,
	"bets_lost" integer DEFAULT 0,
	"net_change" integer DEFAULT 0,
	"win_rate" numeric(5, 2) DEFAULT '0.00',
	"roi" numeric(5, 2) DEFAULT '0.00',
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "bankroll_transactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"transaction_type" text NOT NULL,
	"amount" integer NOT NULL,
	"previous_balance" integer NOT NULL,
	"new_balance" integer NOT NULL,
	"related_bet_id" integer,
	"related_game_id" text,
	"description" text NOT NULL,
	"metadata" jsonb,
	"processed_by" text,
	"status" text DEFAULT 'completed',
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "baseball_reference_pitching_stats" (
	"id" serial PRIMARY KEY NOT NULL,
	"date" date NOT NULL,
	"team" text NOT NULL,
	"pitchers" integer,
	"pitching_age" numeric(4, 1),
	"runs_allowed_per_game" numeric(4, 2),
	"games" integer,
	"games_started" integer,
	"complete_games" integer,
	"shutouts" integer,
	"saves" integer,
	"innings_pitched" numeric(5, 1),
	"hits" integer,
	"runs" integer,
	"earned_runs" integer,
	"home_runs" integer,
	"walks" integer,
	"intentional_walks" integer,
	"strikeouts" integer,
	"hit_by_pitch" integer,
	"balks" integer,
	"wild_pitches" integer,
	"batters_faced" integer,
	"era" numeric(4, 2),
	"fip" numeric(4, 2),
	"whip" numeric(4, 3),
	"h9" numeric(4, 1),
	"hr9" numeric(4, 1),
	"bb9" numeric(4, 1),
	"so9" numeric(4, 1),
	"so_w" numeric(4, 2),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "baseball_reference_stats" (
	"id" serial PRIMARY KEY NOT NULL,
	"date" date NOT NULL,
	"team" text NOT NULL,
	"batters" integer,
	"batting_age" numeric(4, 1),
	"runs_per_game" numeric(4, 2),
	"games" integer,
	"plate_appearances" integer,
	"at_bats" integer,
	"runs" integer,
	"hits" integer,
	"doubles" integer,
	"triples" integer,
	"home_runs" integer,
	"rbis" integer,
	"stolen_bases" integer,
	"caught_stealing" integer,
	"walks" integer,
	"strikeouts" integer,
	"batting_average" numeric(4, 3),
	"on_base_pct" numeric(4, 3),
	"slugging_pct" numeric(4, 3),
	"ops" numeric(4, 3),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "bets" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"game_id" text NOT NULL,
	"bet_type" text NOT NULL,
	"selection" text NOT NULL,
	"odds" integer NOT NULL,
	"stake" numeric(10, 2) NOT NULL,
	"potential_win" numeric(10, 2) NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"result" text,
	"actual_win" numeric(10, 2),
	"placed_at" timestamp DEFAULT now(),
	"notes" text,
	"confidence" integer
);
--> statement-breakpoint
CREATE TABLE "consensus_data" (
	"id" serial PRIMARY KEY NOT NULL,
	"game_id" text NOT NULL,
	"market" text NOT NULL,
	"public_percentage" jsonb NOT NULL,
	"sharp_money" jsonb,
	"line_movement" jsonb,
	"bookmaker_consensus" jsonb,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "daily_picks" (
	"id" serial PRIMARY KEY NOT NULL,
	"date" text NOT NULL,
	"game_id" text NOT NULL,
	"pick_type" text NOT NULL,
	"selection" text NOT NULL,
	"odds" integer NOT NULL,
	"reasoning" text NOT NULL,
	"confidence" integer NOT NULL,
	"expected_value" numeric(5, 2),
	"status" text DEFAULT 'pending' NOT NULL,
	"result" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "friend_invitations" (
	"id" serial PRIMARY KEY NOT NULL,
	"sender_id" integer NOT NULL,
	"recipient_id" integer,
	"recipient_email" text,
	"group_id" integer,
	"status" text DEFAULT 'pending' NOT NULL,
	"message" text,
	"invite_token" text,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"responded_at" timestamp,
	CONSTRAINT "friend_invitations_invite_token_unique" UNIQUE("invite_token")
);
--> statement-breakpoint
CREATE TABLE "friendships" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id_1" integer NOT NULL,
	"user_id_2" integer NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "game_evaluations" (
	"id" serial PRIMARY KEY NOT NULL,
	"date" text NOT NULL,
	"game_id" text NOT NULL,
	"away_team" text NOT NULL,
	"home_team" text NOT NULL,
	"evaluation_status" text NOT NULL,
	"reasoning" text,
	"has_pick_recommended" boolean DEFAULT false NOT NULL,
	"evaluated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "games" (
	"id" serial PRIMARY KEY NOT NULL,
	"game_id" text NOT NULL,
	"away_team" text NOT NULL,
	"home_team" text NOT NULL,
	"away_team_code" text NOT NULL,
	"home_team_code" text NOT NULL,
	"game_time" text NOT NULL,
	"venue" text NOT NULL,
	"away_pitcher" text,
	"home_pitcher" text,
	"away_pitcher_stats" text,
	"home_pitcher_stats" text,
	"status" text DEFAULT 'scheduled' NOT NULL,
	"away_score" integer,
	"home_score" integer,
	"inning" integer,
	"inning_half" text,
	"outs" integer,
	"balls" integer,
	"strikes" integer,
	"runners_on" jsonb,
	"last_play" text,
	"completed_at" timestamp,
	"bets_settled" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "games_game_id_unique" UNIQUE("game_id")
);
--> statement-breakpoint
CREATE TABLE "group_leaderboards" (
	"id" serial PRIMARY KEY NOT NULL,
	"group_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"week_start" timestamp NOT NULL,
	"week_end" timestamp NOT NULL,
	"total_bets" integer DEFAULT 0,
	"won_bets" integer DEFAULT 0,
	"lost_bets" integer DEFAULT 0,
	"win_rate" text DEFAULT '0%',
	"total_staked" text DEFAULT '$0',
	"total_winnings" text DEFAULT '$0',
	"net_profit" text DEFAULT '$0',
	"profit_margin" text DEFAULT '0%',
	"rank" integer DEFAULT 1,
	"points" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "group_memberships" (
	"id" serial PRIMARY KEY NOT NULL,
	"group_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"role" text DEFAULT 'member' NOT NULL,
	"joined_at" timestamp DEFAULT now(),
	"is_active" boolean DEFAULT true
);
--> statement-breakpoint
CREATE TABLE "groups" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"created_by" integer NOT NULL,
	"is_private" boolean DEFAULT false,
	"max_members" integer DEFAULT 50,
	"current_members" integer DEFAULT 1,
	"invite_code" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "groups_invite_code_unique" UNIQUE("invite_code")
);
--> statement-breakpoint
CREATE TABLE "odds" (
	"id" serial PRIMARY KEY NOT NULL,
	"game_id" text NOT NULL,
	"bookmaker" text NOT NULL,
	"market" text NOT NULL,
	"away_odds" integer,
	"home_odds" integer,
	"over_odds" integer,
	"under_odds" integer,
	"total" numeric(3, 1),
	"away_spread" numeric(3, 1),
	"home_spread" numeric(3, 1),
	"away_spread_odds" integer,
	"home_spread_odds" integer,
	"public_percentage" jsonb,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "odds_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"game_id" text NOT NULL,
	"bookmaker" text NOT NULL,
	"market" text NOT NULL,
	"away_odds" integer,
	"home_odds" integer,
	"line" numeric(5, 1),
	"recorded_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "performance_tracking" (
	"id" serial PRIMARY KEY NOT NULL,
	"game_id" text NOT NULL,
	"game_date" text NOT NULL,
	"away_team" text NOT NULL,
	"home_team" text NOT NULL,
	"ai_confidence" integer,
	"predicted_winner" text,
	"predicted_total" numeric(4, 1),
	"predicted_spread" numeric(4, 1),
	"ai_value_plays" jsonb,
	"actual_winner" text,
	"actual_total" numeric(4, 1),
	"actual_spread" numeric(4, 1),
	"final_score" text,
	"winner_correct" boolean,
	"total_correct" boolean,
	"spread_correct" boolean,
	"confidence_accuracy" numeric(5, 2),
	"away_pitcher_actual" jsonb,
	"home_pitcher_actual" jsonb,
	"pitching_prediction_accuracy" numeric(5, 2),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "phrase_detection_rules" (
	"id" serial PRIMARY KEY NOT NULL,
	"phrase" text NOT NULL,
	"category" text NOT NULL,
	"description" text,
	"is_active" boolean DEFAULT true,
	"priority" integer DEFAULT 1,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "player_prop_parlays" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"name" text,
	"selections" jsonb NOT NULL,
	"analysis" jsonb NOT NULL,
	"stake" integer NOT NULL,
	"potential_payout" integer NOT NULL,
	"total_odds" integer NOT NULL,
	"status" text DEFAULT 'pending',
	"result" text,
	"actual_payout" integer,
	"placed_at" timestamp,
	"settled_at" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "player_props" (
	"id" serial PRIMARY KEY NOT NULL,
	"game_id" text NOT NULL,
	"player_name" text NOT NULL,
	"team" text NOT NULL,
	"opponent" text NOT NULL,
	"prop_type" text NOT NULL,
	"line" numeric(10, 2) NOT NULL,
	"over_odds" integer NOT NULL,
	"under_odds" integer NOT NULL,
	"bookmaker" text NOT NULL,
	"category" text NOT NULL,
	"projected_value" numeric(10, 2),
	"edge" numeric(10, 4),
	"is_active" boolean DEFAULT true,
	"last_updated" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "prop_bets" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"prop_id" integer NOT NULL,
	"selection" text NOT NULL,
	"odds" integer NOT NULL,
	"stake" integer NOT NULL,
	"potential_win" integer NOT NULL,
	"status" text DEFAULT 'pending',
	"result" text,
	"actual_win" integer,
	"placed_at" timestamp DEFAULT now(),
	"settled_at" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "props" (
	"id" serial PRIMARY KEY NOT NULL,
	"game_id" text NOT NULL,
	"player" text NOT NULL,
	"prop_type" text NOT NULL,
	"line" text NOT NULL,
	"odds" integer NOT NULL,
	"description" text
);
--> statement-breakpoint
CREATE TABLE "referral_codes" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"user_id" integer,
	"usage_count" integer DEFAULT 0,
	"max_uses" integer,
	"is_active" boolean DEFAULT true,
	"reward_tier" text,
	"reward_duration" integer,
	"commission_percentage" integer DEFAULT 0,
	"total_commission_earned" integer DEFAULT 0,
	"total_referrals" integer DEFAULT 0,
	"last_payout_at" timestamp,
	"payout_status" text DEFAULT 'pending',
	"created_at" timestamp DEFAULT now(),
	"expires_at" timestamp,
	CONSTRAINT "referral_codes_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "tickets" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"category" text NOT NULL,
	"priority" text DEFAULT 'medium' NOT NULL,
	"status" text DEFAULT 'open' NOT NULL,
	"source" text DEFAULT 'ai_automated' NOT NULL,
	"metadata" jsonb,
	"assigned_to" integer,
	"created_by" integer,
	"resolved_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"email" text NOT NULL,
	"password" text NOT NULL,
	"subscription_tier" text DEFAULT 'free' NOT NULL,
	"stripe_customer_id" text,
	"stripe_subscription_id" text,
	"subscription_status" text DEFAULT 'inactive',
	"subscription_end_date" timestamp,
	"referral_code" text,
	"referred_by" text,
	"referral_count" integer DEFAULT 0,
	"is_admin" boolean DEFAULT false,
	"virtual_balance" integer DEFAULT 100000,
	"total_virtual_winnings" integer DEFAULT 0,
	"total_virtual_losses" integer DEFAULT 0,
	"bet_count" integer DEFAULT 0,
	"win_count" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "users_username_unique" UNIQUE("username"),
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_referral_code_unique" UNIQUE("referral_code")
);
--> statement-breakpoint
CREATE TABLE "virtual_bets" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"game_id" text NOT NULL,
	"bet_type" text NOT NULL,
	"selection" text NOT NULL,
	"odds" integer NOT NULL,
	"stake" integer NOT NULL,
	"potential_win" integer NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"result" text,
	"actual_win" integer,
	"placed_at" timestamp DEFAULT now(),
	"settled_at" timestamp,
	"notes" text,
	"confidence" integer
);
--> statement-breakpoint
CREATE TABLE "virtual_betting_slip" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"game_id" text NOT NULL,
	"bet_type" text NOT NULL,
	"selection" text NOT NULL,
	"odds" integer NOT NULL,
	"stake" integer DEFAULT 0,
	"potential_win" integer DEFAULT 0,
	"added_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "weekly_leaderboard" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"week_start" timestamp NOT NULL,
	"week_end" timestamp NOT NULL,
	"total_bets" integer DEFAULT 0,
	"won_bets" integer DEFAULT 0,
	"lost_bets" integer DEFAULT 0,
	"win_rate" numeric(5, 2) DEFAULT '0.00',
	"total_staked" numeric(10, 2) DEFAULT '0.00',
	"total_winnings" numeric(10, 2) DEFAULT '0.00',
	"net_profit" numeric(10, 2) DEFAULT '0.00',
	"profit_margin" numeric(5, 2) DEFAULT '0.00',
	"rank" integer DEFAULT 0,
	"points" integer DEFAULT 0,
	"updated_at" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bankroll_snapshots" ADD CONSTRAINT "bankroll_snapshots_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bankroll_transactions" ADD CONSTRAINT "bankroll_transactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bankroll_transactions" ADD CONSTRAINT "bankroll_transactions_related_bet_id_bets_id_fk" FOREIGN KEY ("related_bet_id") REFERENCES "public"."bets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "friend_invitations" ADD CONSTRAINT "friend_invitations_sender_id_users_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "friend_invitations" ADD CONSTRAINT "friend_invitations_recipient_id_users_id_fk" FOREIGN KEY ("recipient_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "friend_invitations" ADD CONSTRAINT "friend_invitations_group_id_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "friendships" ADD CONSTRAINT "friendships_user_id_1_users_id_fk" FOREIGN KEY ("user_id_1") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "friendships" ADD CONSTRAINT "friendships_user_id_2_users_id_fk" FOREIGN KEY ("user_id_2") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "group_leaderboards" ADD CONSTRAINT "group_leaderboards_group_id_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "group_leaderboards" ADD CONSTRAINT "group_leaderboards_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "group_memberships" ADD CONSTRAINT "group_memberships_group_id_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "group_memberships" ADD CONSTRAINT "group_memberships_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "groups" ADD CONSTRAINT "groups_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "player_prop_parlays" ADD CONSTRAINT "player_prop_parlays_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prop_bets" ADD CONSTRAINT "prop_bets_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prop_bets" ADD CONSTRAINT "prop_bets_prop_id_player_props_id_fk" FOREIGN KEY ("prop_id") REFERENCES "public"."player_props"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referral_codes" ADD CONSTRAINT "referral_codes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_assigned_to_users_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "virtual_bets" ADD CONSTRAINT "virtual_bets_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "virtual_betting_slip" ADD CONSTRAINT "virtual_betting_slip_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "weekly_leaderboard" ADD CONSTRAINT "weekly_leaderboard_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;