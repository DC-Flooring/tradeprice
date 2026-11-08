/*
 * DC Flooring trade site DEMO: sample product ranges.
 * Everything here is invented. Range names are made up and no real manufacturer is named.
 *
 * Structured by RANGE, not by SKU, so a Lightspeed export can be mapped into the same shape later:
 *   id, name, category
 *   heroImage       path to a hero image (the files here are placeholders)
 *   specs           2 to 3 short spec chips
 *   colourways      [{ name, hex, image? }]  the swatch falls back to hex when there is no image
 *   unit            'm²' | 'roll' | 'each'
 *   prices          { trade, tradePlus, tradeGold }   ex VAT, per unit
 *   stock           { status: 'in_stock' | 'order_in' | 'out_of_stock', leadDays? }
 *
 * SUPABASE LATER: this file is replaced by ranges, colourways and tier prices from the database
 * (or a Lightspeed sync). Pages never read `prices` directly: they go through getPricesForTier()
 * and getRange() in app.js, which hand over one tier's price only.
 */
(function () {
  'use strict';

  var CATEGORIES = ['Carpet', 'Vinyl', 'LVT', 'Laminate', 'Underlay', 'Accessories'];

  var RANGES = [
    {
      id: 'harbour-twist', name: 'Harbour twist', category: 'Carpet',
      heroImage: 'assets/ranges/harbour-twist.svg',
      specs: ['4m and 5m widths', 'Heavy domestic', 'Action back'],
      colourways: [
        { name: 'Oatmeal', hex: '#d9cdb6' }, { name: 'Stone', hex: '#bdb4a4' },
        { name: 'Mink', hex: '#8e7c6b' }, { name: 'Fawn', hex: '#b99f80' },
        { name: 'Heather', hex: '#8f8a9a' }, { name: 'Sage', hex: '#9ba592' },
        { name: 'Slate', hex: '#6d7378' }, { name: 'Charcoal', hex: '#3e4145' }
      ],
      unit: 'm²', prices: { trade: 11.40, tradePlus: 10.85, tradeGold: 10.30 },
      stock: { status: 'in_stock' }
    },
    {
      id: 'heritage-saxony', name: 'Heritage saxony', category: 'Carpet',
      heroImage: 'assets/ranges/heritage-saxony.svg',
      specs: ['4m width', 'Luxury domestic', 'Felt back'],
      colourways: [
        { name: 'Cream', hex: '#e6dcc6' }, { name: 'Biscuit', hex: '#cdb48e' },
        { name: 'Taupe', hex: '#a39482' }, { name: 'Dove', hex: '#b5b3ae' },
        { name: 'Walnut', hex: '#6b5545' }, { name: 'Midnight', hex: '#2f3a4f' }
      ],
      unit: 'm²', prices: { trade: 14.90, tradePlus: 14.15, tradeGold: 13.45 },
      stock: { status: 'order_in', leadDays: 5 }
    },
    {
      id: 'sandstone-vinyl', name: 'Sandstone cushion vinyl', category: 'Vinyl',
      heroImage: 'assets/ranges/sandstone-vinyl.svg',
      specs: ['2m, 3m and 4m widths', 'Cushion backed'],
      colourways: [
        { name: 'Sandstone', hex: '#cfc3ab' }, { name: 'Limestone', hex: '#d8d4c9' },
        { name: 'Travertine', hex: '#c4b49a' }, { name: 'Slate grey', hex: '#7c8085' },
        { name: 'Graphite', hex: '#4a4d52' }, { name: 'Terracotta', hex: '#b7694b' }
      ],
      unit: 'm²', prices: { trade: 9.40, tradePlus: 8.95, tradeGold: 8.50 },
      stock: { status: 'in_stock' }
    },
    {
      id: 'oakline-lvt', name: 'Oakline luxury vinyl planks', category: 'LVT',
      heroImage: 'assets/ranges/oakline-lvt.svg',
      specs: ['1220 x 180mm planks', '5mm with 0.55mm wear layer', 'Click fit'],
      colourways: [
        { name: 'Natural oak', hex: '#c9a272' }, { name: 'Honey oak', hex: '#b98a4e' },
        { name: 'Smoked oak', hex: '#7a5c42' }, { name: 'Grey oak', hex: '#9a958c' },
        { name: 'White oak', hex: '#ddd0b8' }, { name: 'Walnut', hex: '#5e4333' },
        { name: 'Ash', hex: '#b9b3a5' }
      ],
      unit: 'm²', prices: { trade: 28.90, tradePlus: 27.45, tradeGold: 26.10 },
      stock: { status: 'order_in', leadDays: 3 }
    },
    {
      id: 'naturals-laminate', name: 'Naturals 8mm laminate', category: 'Laminate',
      heroImage: 'assets/ranges/naturals-laminate.svg',
      specs: ['8mm thick', 'AC4 wear rating', 'Click fit'],
      colourways: [
        { name: 'Light oak', hex: '#d3b384' }, { name: 'Natural oak', hex: '#b8915f' },
        { name: 'Pale ash', hex: '#d9d0bf' }, { name: 'Grey oak', hex: '#928d84' },
        { name: 'Dark oak', hex: '#5f4a39' }, { name: 'Cottage white', hex: '#e4ddd0' }
      ],
      unit: 'm²', prices: { trade: 8.10, tradePlus: 7.70, tradeGold: 7.30 },
      stock: { status: 'in_stock' }
    },
    {
      id: 'chevron-laminate', name: 'Chevron 12mm laminate', category: 'Laminate',
      heroImage: 'assets/ranges/chevron-laminate.svg',
      specs: ['12mm thick', 'AC5 wear rating', 'Herringbone pattern'],
      colourways: [
        { name: 'Warm walnut', hex: '#7a5340' }, { name: 'Silver oak', hex: '#aaa598' },
        { name: 'Honey herringbone', hex: '#c0935a' }, { name: 'Smoked grey', hex: '#6b6862' }
      ],
      unit: 'm²', prices: { trade: 21.50, tradePlus: 20.40, tradeGold: 19.40 },
      stock: { status: 'out_of_stock' }
    },
    {
      id: 'comfort-underlay', name: 'Comfort 9mm foam underlay', category: 'Underlay',
      heroImage: 'assets/ranges/comfort-underlay.svg',
      specs: ['9mm thick', '15 m² roll'],
      colourways: [ { name: 'Grey', hex: '#9a9d9f' }, { name: 'Blue', hex: '#7f9bb5' } ],
      unit: 'roll', prices: { trade: 28.50, tradePlus: 27.10, tradeGold: 25.75 },
      stock: { status: 'in_stock' }
    },
    {
      id: 'door-bars', name: 'Aluminium door bars', category: 'Accessories',
      heroImage: 'assets/ranges/door-bars.svg',
      specs: ['900mm length', 'Aluminium'],
      colourways: [
        { name: 'Silver', hex: '#c4c7ca' }, { name: 'Brushed brass', hex: '#b79a5d' },
        { name: 'Bronze', hex: '#7f5f3a' }, { name: 'Black', hex: '#2a2a2a' }
      ],
      unit: 'each', prices: { trade: 5.80, tradePlus: 5.50, tradeGold: 5.25 },
      stock: { status: 'order_in', leadDays: 10 }
    }
  ];

  window.DC_DEMO_RANGES = { categories: CATEGORIES, ranges: RANGES };
})();
