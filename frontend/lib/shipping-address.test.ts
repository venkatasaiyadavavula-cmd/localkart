import { toShippingAddressPayload } from './shipping-address';

describe('toShippingAddressPayload', () => {
  it('strips UI-only fields type and saveAddress', () => {
    const payload = toShippingAddressPayload(
      {
        name: 'QA',
        phone: '9876512345',
        address: 'RTC Bus Stand',
        city: 'Kadapa',
        state: 'Andhra Pradesh',
        pincode: '516001',
        type: 'home',
        saveAddress: true,
      },
      { latitude: 14.47, longitude: 78.82 },
    );

    expect(payload).toEqual({
      name: 'QA',
      phone: '+919876512345',
      address: 'RTC Bus Stand',
      city: 'Kadapa',
      state: 'Andhra Pradesh',
      pincode: '516001',
      latitude: 14.47,
      longitude: 78.82,
    });
    expect(payload).not.toHaveProperty('type');
    expect(payload).not.toHaveProperty('saveAddress');
  });
});
