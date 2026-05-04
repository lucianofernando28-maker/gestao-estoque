CREATE TYPE "public"."role" AS ENUM('ADMIN', 'USER');--> statement-breakpoint
CREATE TABLE "products" (
	"id" varchar PRIMARY KEY NOT NULL,
	"name" varchar NOT NULL,
	"price" numeric(10, 2) NOT NULL,
	"stock_quantity" integer DEFAULT 0 NOT NULL,
	"total_price" numeric(10, 2) NOT NULL,
	"created_At" timestamp DEFAULT now() NOT NULL,
	"update_At" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "products_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "refresh_token" (
	"id" varchar PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"token" varchar NOT NULL,
	"expires_at" timestamp NOT NULL,
	"revoked" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "refresh_token_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" varchar PRIMARY KEY NOT NULL,
	"email" varchar NOT NULL,
	"password_hash" varchar NOT NULL,
	"role" "role" DEFAULT 'USER' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "refresh_token" ADD CONSTRAINT "refresh_token_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;