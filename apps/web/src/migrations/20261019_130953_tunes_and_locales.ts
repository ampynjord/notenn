import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."_locales" AS ENUM('fr', 'en');
  CREATE TYPE "public"."enum_tunes_region" AS ENUM('brittany', 'france', 'ireland', 'scotland', 'england', 'germany', 'usa', 'international');
  CREATE TYPE "public"."enum_tunes_kind" AS ENUM('air', 'song', 'childrens-song', 'dance', 'jig', 'slip-jig', 'reel', 'march', 'waltz', 'shanty', 'lullaby', 'spiritual', 'classical');
  CREATE TYPE "public"."enum_tunes_level" AS ENUM('beginner', 'intermediate', 'advanced');
  CREATE TYPE "public"."enum_tunes_licence" AS ENUM('public-domain', 'free-licence');
  CREATE TABLE "tunes" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"slug" varchar NOT NULL,
  	"region" "enum_tunes_region" NOT NULL,
  	"kind" "enum_tunes_kind" NOT NULL,
  	"level" "enum_tunes_level" NOT NULL,
  	"origin" varchar NOT NULL,
  	"licence" "enum_tunes_licence" DEFAULT 'public-domain' NOT NULL,
  	"abc" varchar NOT NULL,
  	"published" boolean DEFAULT true,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "tunes_locales" (
  	"notes" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "tunes_id" integer;
  ALTER TABLE "tunes_locales" ADD CONSTRAINT "tunes_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."tunes"("id") ON DELETE cascade ON UPDATE no action;
  CREATE UNIQUE INDEX "tunes_slug_idx" ON "tunes" USING btree ("slug");
  CREATE INDEX "tunes_updated_at_idx" ON "tunes" USING btree ("updated_at");
  CREATE INDEX "tunes_created_at_idx" ON "tunes" USING btree ("created_at");
  CREATE UNIQUE INDEX "tunes_locales_locale_parent_id_unique" ON "tunes_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "tunes_locales_parent_id_idx" ON "tunes_locales" USING btree ("_parent_id");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_tunes_fk" FOREIGN KEY ("tunes_id") REFERENCES "public"."tunes"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_tunes_id_idx" ON "payload_locked_documents_rels" USING btree ("tunes_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "tunes" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "tunes_locales" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "tunes" CASCADE;
  DROP TABLE "tunes_locales" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_tunes_fk";
  
  DROP INDEX "payload_locked_documents_rels_tunes_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "tunes_id";
  DROP TYPE "public"."_locales";
  DROP TYPE "public"."enum_tunes_region";
  DROP TYPE "public"."enum_tunes_kind";
  DROP TYPE "public"."enum_tunes_level";
  DROP TYPE "public"."enum_tunes_licence";`)
}
