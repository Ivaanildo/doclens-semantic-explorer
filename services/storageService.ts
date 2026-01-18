
import { Conversation } from '../types';

const STORAGE_KEY = 'doclens_conversations_v3';

export const getConversations = (): Conversation[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (e) {
    console.error("Failed to load conversations", e);
    return [];
  }
};

export const saveConversation = (conversation: Conversation) => {
  try {
    let conversations = getConversations();
    const index = conversations.findIndex(c => c.id === conversation.id);
    
    if (index >= 0) {
      conversations[index] = conversation;
    } else {
      conversations.unshift(conversation);
    }

    // Ensure we are working with the latest timestamps for sorting
    conversations.sort((a, b) => b.updatedAt - a.updatedAt);
    
    // Progressive trimming strategy to handle quota limits
    let success = false;
    while (!success && conversations.length > 0) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
        success = true;
      } catch (e) {
        if (conversations.length > 1) {
          // Remove the oldest conversation and try again
          conversations.pop();
          console.warn("DocLens: Storage quota exceeded, removing oldest conversation to make space.");
        } else {
          // If even a single conversation is too big (likely due to many large images)
          const single = conversations[0];
          let modified = false;

          // Strategy: Strip images from older messages in the current conversation
          let imageCount = 0;
          for (let i = single.messages.length - 1; i >= 0; i--) {
            if (single.messages[i].attachments && single.messages[i].attachments!.length > 0) {
              imageCount++;
              // Keep only the last 2 messages with images to save space
              if (imageCount > 2) {
                delete single.messages[i].attachments;
                modified = true;
              }
            }
          }

          if (modified) {
            try {
              localStorage.setItem(STORAGE_KEY, JSON.stringify([single]));
              success = true;
              console.warn("DocLens: Single conversation too large, stripped older images to save.");
            } catch (innerE) {
              console.error("DocLens: Storage failed even after stripping images.");
              break;
            }
          } else {
            // Text-only conversation is too big for localStorage? Extremely rare.
            console.error("DocLens: Conversation too large for storage despite no images.");
            break;
          }
        }
      }
    }
  } catch (e) {
    console.error("Failed to save conversation", e);
  }
};

export const deleteConversation = (id: string) => {
  try {
    const conversations = getConversations().filter(c => c.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
  } catch (e) {
    console.error("Failed to delete conversation", e);
  }
};

export const createNewConversation = (fileName?: string): Conversation => {
  return {
    id: crypto.randomUUID(),
    title: fileName ? `Analysis: ${fileName}` : 'New Analysis',
    messages: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
    fileName
  };
};

export const updateConversationTitle = (id: string, title: string) => {
  const conversations = getConversations();
  const index = conversations.findIndex(c => c.id === id);
  if (index >= 0) {
    conversations[index].title = title;
    conversations[index].updatedAt = Date.now();
    // Use the robust save mechanism to ensure consistency
    saveConversation(conversations[index]);
  }
}
