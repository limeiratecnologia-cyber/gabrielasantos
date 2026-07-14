/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export type MoodType = "very_happy" | "happy" | "neutral" | "sad" | "very_sad";

export interface JournalEntry {
  id: string;
  date: string;
  mood: MoodType;
  text: string;
  analysis?: string;
  analyzing?: boolean;
}

export interface Booking {
  id: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  approach: string;
  date: string;
  timeSlot: string;
  notes?: string;
  status: "scheduled" | "completed" | "cancelled";
}

export interface Approach {
  id: string;
  name: string;
  fullName: string;
  shortDescription: string;
  longDescription: string;
  corePrinciples: string[];
  reframingExample: {
    original: string;
    distortion: string;
    reframed: string;
    explanation: string;
  };
  quote: string;
}

export type ActiveTab = "home" | "approaches" | "booking" | "admin";
