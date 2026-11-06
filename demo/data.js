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
  var TIERS = [
    { id: 'trade', label: 'Trade',      minSpend: 0 },
    { id: 'plus',  label: 'Trade Plus', minSpend: 5000 },
    { id: 'gold',  label: 'Trade Gold', minSpend: 15000 }
  ];

  var CATEGORIES = ['Carpet', 'Vinyl', 'Laminate', 'Underlay', 'Accessories'];

  // 14 sample products. Each tier is a little cheaper than the one before. Prices are ex VAT.
  // stock: 'in' (In stock), 'low' (Low stock), 'order' (Order in)
  var PRODUCTS = [
    { id: 'p01', sku: 'SMP-001', name: 'Harbour Twist 50oz Carpet',      category: 'Carpet',      size: '4m wide roll',        soldBy: 'm²',   stock: 'in',    prices: { trade: 14.90, plus: 14.20, gold: 13.50 } },
    { id: 'p02', sku: 'SMP-002', name: 'Heritage Saxony Carpet',         category: 'Carpet',      size: '4m wide roll',        soldBy: 'm²',   stock: 'in',    prices: { trade: 11.60, plus: 11.05, gold: 10.50 } },
    { id: 'p03', sku: 'SMP-003', name: 'Contract Loop Pile Carpet',      category: 'Carpet',      size: '4m wide roll',        soldBy: 'm²',   stock: 'low',   prices: { trade: 8.95,  plus: 8.50,  gold: 8.10 } },
    { id: 'p04', sku: 'SMP-004', name: 'Stairway Wool Blend Carpet',     category: 'Carpet',      size: '4m wide roll',        soldBy: 'm²',   stock: 'order', prices: { trade: 21.40, plus: 20.35, gold: 19.30 } },
    { id: 'p05', sku: 'SMP-005', name: 'Sandstone Cushion Vinyl',        category: 'Vinyl',       size: '3m or 4m wide roll',  soldBy: 'm²',   stock: 'in',    prices: { trade: 9.40,  plus: 8.95,  gold: 8.50 } },
    { id: 'p06', sku: 'SMP-006', name: 'Oak Plank Luxury Vinyl Tile',    category: 'Vinyl',       size: '1220 x 180mm, 2.2m² pack', soldBy: 'Pack', stock: 'in',    prices: { trade: 38.50, plus: 36.60, gold: 34.80 } },
    { id: 'p07', sku: 'SMP-007', name: 'Slate Safety Vinyl',             category: 'Vinyl',       size: '2m wide roll',        soldBy: 'm²',   stock: 'low',   prices: { trade: 17.20, plus: 16.35, gold: 15.55 } },
    { id: 'p08', sku: 'SMP-008', name: 'Natural Oak 8mm Laminate',       category: 'Laminate',    size: '1285 x 192mm, 2.2m² pack', soldBy: 'Pack', stock: 'in',    prices: { trade: 17.90, plus: 17.00, gold: 16.15 } },
    { id: 'p09', sku: 'SMP-009', name: 'Grey Oak 12mm Laminate AC5',     category: 'Laminate',    size: '1285 x 192mm, 1.7m² pack', soldBy: 'Pack', stock: 'low',   prices: { trade: 24.80, plus: 23.55, gold: 22.40 } },
    { id: 'p10', sku: 'SMP-010', name: 'Herringbone Walnut 12mm Laminate', category: 'Laminate',  size: '600 x 120mm, 1.4m² pack',  soldBy: 'Pack', stock: 'order', prices: { trade: 36.90, plus: 35.05, gold: 33.30 } },
    { id: 'p11', sku: 'SMP-011', name: 'Premium 9mm Foam Underlay',      category: 'Underlay',    size: '15m² roll',      soldBy: 'Roll',      stock: 'in',    prices: { trade: 28.50, plus: 27.10, gold: 25.75 } },
    { id: 'p12', sku: 'SMP-012', name: 'Acoustic Laminate Underlay 3mm', category: 'Underlay',    size: '15m² roll',      soldBy: 'Roll',      stock: 'in',    prices: { trade: 21.90, plus: 20.80, gold: 19.75 } },
    { id: 'p13', sku: 'SMP-013', name: 'Aluminium Door Bar',             category: 'Accessories', size: '900mm, silver',       soldBy: 'Each',      stock: 'in',    prices: { trade: 5.80,  plus: 5.50,  gold: 5.25 } },
    { id: 'p14', sku: 'SMP-014', name: 'Smooth Edge Carpet Gripper',     category: 'Accessories', size: '1m lengths, box of 50', soldBy: 'Box',     stock: 'low',   prices: { trade: 24.90, plus: 23.65, gold: 22.50 } }
  ];

  // 3 sample offers. endsLabel is a placeholder until real dates are supplied.
  var OFFERS = [
    { id: 'o1', title: 'Premium 9mm Foam Underlay',    note: 'Roll of 15m². Stock up before the busy season.', was: 28.50, now: 24.99, endsLabel: '[DATE]' },
    { id: 'o2', title: 'Natural Oak 8mm Laminate',     note: 'Pack of 2.2m². Popular with landlords.',          was: 17.90, now: 15.95, endsLabel: '[DATE]' },
    { id: 'o3', title: 'Aluminium Door Bars, box of 10', note: 'Silver, 900mm. Fitting essentials.',                 was: 58.00, now: 49.00, endsLabel: '[DATE]' }
  ];

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
        status: 'approved', tier: 'plus', spendYtd: 9400, idChecked: true, idCheckedDate: stamp, idCheckedBy: 'Staff member',
        decidedOn: stamp, appliedOn: dayOffset(90), source: 'demo customer' }),
      acct({ id: 'c-gold', businessName: 'Northgate Lettings and Maintenance', tradeType: 'landlord', contactName: 'Dan Okafor',
        phone: '07700 900104', email: 'dan@example.com', postcode: 'AB7 8JK', vat: 'GB000000002', spend: 'Over £5,000',
        status: 'approved', tier: 'gold', spendYtd: 21750, idChecked: true, idCheckedDate: stamp, idCheckedBy: 'Staff member',
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
    CATEGORIES: CATEGORIES,
    PRODUCTS: PRODUCTS,
    OFFERS: OFFERS,
    GUIDES: GUIDES,
    TRADE_TYPES: { fitter: 'Fitter', builder: 'Builder', landlord: 'Landlord', other: 'Other' },
    SPEND_RANGES: ['Under £500', '£500 to £1,500', '£1,500 to £5,000', 'Over £5,000'],
    makeSeedAccounts: makeSeedAccounts
  };
})();
