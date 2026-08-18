import { describe, expect, it } from '@jest/globals';
import { getConnectionStatusPresentation } from '../connectionStatusPresentation';

describe('getConnectionStatusPresentation', () => {
  it('CONNECTED -> yeşil, "Bağlı"', () => {
    expect(getConnectionStatusPresentation('CONNECTED')).toEqual({ label: 'Bağlı', dotColor: '#2ECC71' });
  });

  it('CONNECTING ve RECONNECTING -> aynı turuncu, "Bağlanıyor"', () => {
    expect(getConnectionStatusPresentation('CONNECTING')).toEqual(getConnectionStatusPresentation('RECONNECTING'));
    expect(getConnectionStatusPresentation('CONNECTING').label).toBe('Bağlanıyor');
  });

  it('DISCONNECTED -> "Çevrimdışı"', () => {
    expect(getConnectionStatusPresentation('DISCONNECTED').label).toBe('Çevrimdışı');
  });
});
