-- SQLite: 기본값 true로 추가해 기존 행은 모두 승인된 것으로 둠
ALTER TABLE "User" ADD COLUMN "approved" BOOLEAN NOT NULL DEFAULT 1;
