CREATE TABLE "favorites_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"wiki_id" uuid NOT NULL,
	"list_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"note" varchar(200) DEFAULT '',
	CONSTRAINT "favorites_items_wiki_list_unique" UNIQUE("wiki_id","list_id")
);
--> statement-breakpoint
CREATE TABLE "favorites_lists" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" varchar(500),
	"color" varchar(7),
	"is_default" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "test" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"provider" varchar(20) DEFAULT 'email' NOT NULL,
	"email" varchar(255) NOT NULL,
	"name" varchar(100) NOT NULL,
	"avatar" text,
	"display_name" varchar(100),
	"bio" text,
	"role" varchar(20) DEFAULT 'editor' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"last_login_at" timestamp,
	"login_count" integer DEFAULT 0 NOT NULL,
	"preferences" jsonb DEFAULT '{"theme":"auto","language":"ko","notifications":true,"emailNotifications":false}'::jsonb NOT NULL,
	"metadata" jsonb,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "wiki_contributors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"wiki_id" uuid NOT NULL,
	"contributor_id" uuid NOT NULL,
	"contributor_name" varchar(100) NOT NULL,
	"contributor_email" varchar(255) NOT NULL,
	"contributed_at" timestamp DEFAULT now() NOT NULL,
	"first_contributed_at" timestamp DEFAULT now() NOT NULL,
	"lines_added" integer DEFAULT 0 NOT NULL,
	"lines_removed" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "wiki_contributors_wiki_contributor_unique" UNIQUE("wiki_id","contributor_id")
);
--> statement-breakpoint
CREATE TABLE "wiki_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"wiki_id" uuid NOT NULL,
	"version" integer NOT NULL,
	"title" varchar(200) NOT NULL,
	"content" text NOT NULL,
	"change_message" varchar(500) DEFAULT '' NOT NULL,
	"change_type" varchar(20) NOT NULL,
	"changed_by" uuid NOT NULL,
	"changed_by_name" varchar(100) NOT NULL,
	"changed_by_email" varchar(255) NOT NULL,
	"changed_at" timestamp DEFAULT now() NOT NULL,
	"previous_version" uuid,
	"parent_versions" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"content_size" integer DEFAULT 0 NOT NULL,
	"content_hash" varchar(64) NOT NULL,
	"added_characters" integer DEFAULT 0 NOT NULL,
	"removed_characters" integer DEFAULT 0 NOT NULL,
	"is_minor" boolean DEFAULT false NOT NULL,
	"tags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"added_tags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"removed_tags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"metadata" jsonb,
	CONSTRAINT "wiki_history_wiki_version_unique" UNIQUE("wiki_id","version")
);
--> statement-breakpoint
CREATE TABLE "wikis" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(200) NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"latest_version" integer DEFAULT 0 NOT NULL,
	"author_id" uuid NOT NULL,
	"author_name" varchar(100) NOT NULL,
	"author_email" varchar(255) NOT NULL,
	"last_editor" uuid NOT NULL,
	"last_editor_name" varchar(100) NOT NULL,
	"last_editor_email" varchar(255) NOT NULL,
	"is_published" boolean DEFAULT true NOT NULL,
	"tags" jsonb DEFAULT '[]'::jsonb NOT NULL
);
--> statement-breakpoint
ALTER TABLE "favorites_items" ADD CONSTRAINT "favorites_items_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "favorites_items" ADD CONSTRAINT "favorites_items_wiki_id_wikis_id_fk" FOREIGN KEY ("wiki_id") REFERENCES "public"."wikis"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "favorites_items" ADD CONSTRAINT "favorites_items_list_id_favorites_lists_id_fk" FOREIGN KEY ("list_id") REFERENCES "public"."favorites_lists"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "favorites_lists" ADD CONSTRAINT "favorites_lists_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wiki_contributors" ADD CONSTRAINT "wiki_contributors_wiki_id_wikis_id_fk" FOREIGN KEY ("wiki_id") REFERENCES "public"."wikis"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wiki_contributors" ADD CONSTRAINT "wiki_contributors_contributor_id_users_id_fk" FOREIGN KEY ("contributor_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wiki_history" ADD CONSTRAINT "wiki_history_wiki_id_wikis_id_fk" FOREIGN KEY ("wiki_id") REFERENCES "public"."wikis"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wiki_history" ADD CONSTRAINT "wiki_history_changed_by_users_id_fk" FOREIGN KEY ("changed_by") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wikis" ADD CONSTRAINT "wikis_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wikis" ADD CONSTRAINT "wikis_last_editor_users_id_fk" FOREIGN KEY ("last_editor") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "favorites_items_user_wiki_list_idx" ON "favorites_items" USING btree ("user_id","wiki_id","list_id");--> statement-breakpoint
CREATE INDEX "favorites_items_user_idx" ON "favorites_items" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "favorites_items_wiki_idx" ON "favorites_items" USING btree ("wiki_id");--> statement-breakpoint
CREATE INDEX "favorites_items_list_idx" ON "favorites_items" USING btree ("list_id");--> statement-breakpoint
CREATE INDEX "favorites_lists_user_idx" ON "favorites_lists" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "favorites_lists_user_name_idx" ON "favorites_lists" USING btree ("user_id","name");--> statement-breakpoint
CREATE INDEX "favorites_lists_sort_order_idx" ON "favorites_lists" USING btree ("sort_order");--> statement-breakpoint
CREATE INDEX "users_email_idx" ON "users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "users_role_idx" ON "users" USING btree ("role");--> statement-breakpoint
CREATE INDEX "users_provider_idx" ON "users" USING btree ("provider");--> statement-breakpoint
CREATE INDEX "wiki_contributors_wiki_contributor_idx" ON "wiki_contributors" USING btree ("wiki_id","contributor_id");--> statement-breakpoint
CREATE INDEX "wiki_contributors_contributor_idx" ON "wiki_contributors" USING btree ("contributor_id");--> statement-breakpoint
CREATE INDEX "wiki_contributors_wiki_idx" ON "wiki_contributors" USING btree ("wiki_id");--> statement-breakpoint
CREATE INDEX "wiki_history_wiki_version_idx" ON "wiki_history" USING btree ("wiki_id","version");--> statement-breakpoint
CREATE INDEX "wiki_history_wiki_idx" ON "wiki_history" USING btree ("wiki_id");--> statement-breakpoint
CREATE INDEX "wiki_history_changed_by_idx" ON "wiki_history" USING btree ("changed_by");--> statement-breakpoint
CREATE INDEX "wiki_history_changed_at_idx" ON "wiki_history" USING btree ("changed_at");--> statement-breakpoint
CREATE INDEX "wiki_history_change_type_idx" ON "wiki_history" USING btree ("change_type");--> statement-breakpoint
CREATE INDEX "wikis_title_idx" ON "wikis" USING btree ("title");--> statement-breakpoint
CREATE INDEX "wikis_author_idx" ON "wikis" USING btree ("author_id");--> statement-breakpoint
CREATE INDEX "wikis_last_editor_idx" ON "wikis" USING btree ("last_editor");--> statement-breakpoint
CREATE INDEX "wikis_published_idx" ON "wikis" USING btree ("is_published");--> statement-breakpoint
CREATE INDEX "wikis_created_at_idx" ON "wikis" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "wikis_updated_at_idx" ON "wikis" USING btree ("updated_at");