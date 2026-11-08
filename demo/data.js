/*
 * DC Flooring trade site DEMO: all sample data.
 * Every name, price, stock level and customer below is invented.
 * Nothing here is a real price, customer or business.
 *
 * SUPABASE LATER: products, offers and accounts would come from tables
 * (products, product_prices, offers, profiles/applications) instead of this file.
 */
(function () {
  'use strict';

  // Tiers are granted by staff. The spend figures only drive the "next tier" nudge.
  // [SAMPLE] thresholds, replace with the real rules when they are agreed.
  // The ids match the price keys used in assets/data/ranges.js.
  var TIERS = [
    { id: 'trade',     label: 'Trade',      minSpend: 0 },
    { id: 'tradePlus', label: 'Trade Plus', minSpend: 5000 },
    { id: 'tradeGold', label: 'Trade Gold', minSpend: 15000 }
  ];

  // Sample offers (ex VAT, per unit). endsLabel is a placeholder until real dates are supplied.
  // Products and ranges now live in assets/data/ranges.js.
  var OFFERS = [
    { id: 'o1', title: 'Comfort 9mm foam underlay',  note: 'Roll of 15 m\u00b2. Stock up before the busy season.', was: 28.50, now: 24.99, unit: 'roll' },
    { id: 'o2', title: 'Naturals 8mm laminate',      note: 'Click fit, popular with landlords.',                    was: 8.10,  now: 7.15,  unit: 'm\u00b2' },
    { id: 'o3', title: 'Aluminium door bars',        note: '900mm, silver. Fitting essentials.',                    was: 5.80,  now: 4.95,  unit: 'each' }
  ].map(function (o) { o.endsLabel = '[DATE]'; return o; });

  var GUIDES = [
    { id: 'g1', title: 'Measuring up for carpet',          note: 'Work out roll widths, waste and seams before you order.' },
    { id: 'g2', title: 'Choosing the right underlay',      note: 'Foam, felt or acoustic: what suits which job.' },
    { id: 'g3', title: 'Vinyl or laminate?',               note: 'A quick comparison for kitchens, bathrooms and hallways.' }
  ];

  function dayOffset(n) {
    var d = new Date();
    d.setDate(d.getDate() - n);
    return d.toISOString();
  }

  /*
   * Seed accounts: 6 demo customers, then 3 pending applications.
   * Phone numbers use the Ofcom drama range (07700 900xxx), emails use example.com.
   */
  function makeSeedAccounts() {
    function acct(o) {
      return Object.assign({
        vat: '', status: 'pending', tier: null, spendYtd: 0,
        idChecked: false, idCheckedDate: null, idCheckedBy: null,
        notes: '', decidedOn: null, source: 'application'
      }, o);
    }
    var stamp = dayOffset(30);
    return [
      acct({ id: 'c-trade', businessName: 'Carter Floor Fitting', tradeType: 'fitter', contactName: 'Sam Carter',
        phone: '07700 900101', email: 'sam@example.com', postcode: 'AB1 2CD', vat: '', spend: 'Under £500',
        status: 'approved', tier: 'trade', spendYtd: 3200, idChecked: true, idCheckedDate: stamp, idCheckedBy: 'Staff member',
        decidedOn: stamp, appliedOn: dayOffset(40), source: 'demo customer' }),
      acct({ id: 'c-trade2', businessName: 'Ridgeway Property Services', tradeType: 'builder', contactName: 'Jo Bennett',
        phone: '07700 900102', email: 'jo@example.com', postcode: 'AB3 4EF', vat: 'GB000000000', spend: '£500 to £1,500',
        status: 'approved', tier: 'trade', spendYtd: 4600, idChecked: true, idCheckedDate: stamp, idCheckedBy: 'Staff member',
        decidedOn: stamp, appliedOn: dayOffset(45), source: 'demo customer' }),
      acct({ id: 'c-plus', businessName: 'Mapleleaf Builders', tradeType: 'builder', contactName: 'Priya Shah',
        phone: '07700 900103', email: 'priya@example.com', postcode: 'AB5 6GH', vat: 'GB000000001', spend: '£1,500 to £5,000',
        status: 'approved', tier: 'tradePlus', spendYtd: 9400, idChecked: true, idCheckedDate: stamp, idCheckedBy: 'Staff member',
        decidedOn: stamp, appliedOn: dayOffset(90), source: 'demo customer' }),
      acct({ id: 'c-gold', businessName: 'Northgate Lettings and Maintenance', tradeType: 'landlord', contactName: 'Dan Okafor',
        phone: '07700 900104', email: 'dan@example.com', postcode: 'AB7 8JK', vat: 'GB000000002', spend: 'Over £5,000',
        status: 'approved', tier: 'tradeGold', spendYtd: 21750, idChecked: true, idCheckedDate: stamp, idCheckedBy: 'Staff member',
        decidedOn: stamp, appliedOn: dayOffset(200), source: 'demo customer' }),
      acct({ id: 'c-pending', businessName: 'Willow Lane Flooring', tradeType: 'fitter', contactName: 'Lee Wong',
        phone: '07700 900105', email: 'lee@example.com', postcode: 'AB9 1LM', spend: 'Under £500',
        status: 'pending', appliedOn: dayOffset(1), source: 'demo customer' }),
      acct({ id: 'c-rejected', businessName: 'Fenwick Home Improvements', tradeType: 'other', contactName: 'Chris Fenwick',
        phone: '07700 900106', email: 'chris@example.com', postcode: 'AB2 3NP', spend: 'Under £500',
        status: 'rejected', notes: 'Could not confirm trade status.', decidedOn: dayOffset(7), appliedOn: dayOffset(9), source: 'demo customer' }),

      acct({ id: 'a-1', businessName: 'Greenfield Carpets', tradeType: 'fitter', contactName: 'Hannah Reid',
        phone: '07700 900201', email: 'hannah@example.com', postcode: 'AB4 5QR', vat: 'GB000000003', spend: '£500 to £1,500', appliedOn: dayOffset(2) }),
      acct({ id: 'a-2', businessName: 'Oakhill Property Group', tradeType: 'landlord', contactName: 'Marcus Webb',
        phone: '07700 900202', email: 'marcus@example.com', postcode: 'AB6 7ST', spend: '£1,500 to £5,000', appliedOn: dayOffset(1) }),
      acct({ id: 'a-3', businessName: 'Stone and Sons Builders', tradeType: 'builder', contactName: 'Ellie Stone',
        phone: '07700 900203', email: 'ellie@example.com', postcode: 'AB8 9UV', vat: 'GB000000004', spend: 'Over £5,000', appliedOn: dayOffset(0) })
    ];
  }

  window.DC_DEMO_DATA = {
    TIERS: TIERS,
    OFFERS: OFFERS,
    GUIDES: GUIDES,
    TRADE_TYPES: { fitter: 'Fitter', builder: 'Builder', landlord: 'Landlord', other: 'Other' },
    SPEND_RANGES: ['Under £500', '£500 to £1,500', '£1,500 to £5,000', 'Over £5,000'],
    makeSeedAccounts: makeSeedAccounts
  };
})();
