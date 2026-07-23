-- CreateEnum
CREATE TYPE "AccountStatus" AS ENUM ('active', 'error', 'untested');
CREATE TYPE "CampaignStatus" AS ENUM ('draft', 'active', 'paused', 'stopped', 'completed');
CREATE TYPE "LeadStatus" AS ENUM ('active', 'unsubscribed', 'bounced', 'replied');
CREATE TYPE "LeadCampaignStatus" AS ENUM ('active', 'replied', 'unsubscribed', 'bounced', 'completed');
CREATE TYPE "EmailEventType" AS ENUM ('sent', 'opened', 'clicked', 'replied', 'bounced', 'unsubscribed');
CREATE TYPE "InboxLabel" AS ENUM ('none', 'interested', 'not_interested', 'meeting_booked', 'unsubscribed');
