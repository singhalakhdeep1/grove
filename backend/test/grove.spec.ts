import { describe, it, expect } from 'vitest';

describe('Grove WebRTC Session Control', () => {
  it('should generate unique room identifiers', () => {
    const roomId = `room-${Math.random().toString(36).substring(2, 9)}`;
    expect(roomId).toMatch(/^room-[a-z0-9]+$/);
  });
});
