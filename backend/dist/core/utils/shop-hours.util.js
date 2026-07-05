"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createDefaultOperatingHours = createDefaultOperatingHours;
exports.isShopCurrentlyOpen = isShopCurrentlyOpen;
exports.getShopHoursStatus = getShopHoursStatus;
exports.enrichShopWithHoursStatus = enrichShopWithHoursStatus;
exports.enrichProductWithShopHours = enrichProductWithShopHours;
exports.enrichProductsWithShopHours = enrichProductsWithShopHours;
exports.migrateLegacyHoursToOperatingHours = migrateLegacyHoursToOperatingHours;
const shop_entity_1 = require("../entities/shop.entity");
const DAY_KEYS = [
    'sunday',
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday',
    'saturday',
];
const JS_DAY_TO_KEY = [
    'sunday',
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday',
    'saturday',
];
function createDefaultOperatingHours() {
    const weekday = { open: '09:00', close: '21:00', isOpen: true };
    const sunday = { open: '09:00', close: '21:00', isOpen: false };
    return {
        monday: { ...weekday },
        tuesday: { ...weekday },
        wednesday: { ...weekday },
        thursday: { ...weekday },
        friday: { ...weekday },
        saturday: { ...weekday },
        sunday: { ...sunday },
    };
}
function normalizeTime(value) {
    if (!value)
        return '00:00';
    return value.slice(0, 5);
}
function timeToMinutes(value) {
    const [h, m] = normalizeTime(value).split(':').map(Number);
    return h * 60 + m;
}
function formatTime12h(value) {
    const [h, m] = normalizeTime(value).split(':').map(Number);
    const period = h >= 12 ? 'PM' : 'AM';
    const hour12 = h % 12 || 12;
    return `${hour12}:${m.toString().padStart(2, '0')} ${period}`;
}
function getNowInIST() {
    return new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
}
function getTodaySchedule(shop) {
    const hours = shop.operatingHours;
    if (!hours) {
        if (shop.openingTime && shop.closingTime) {
            return {
                open: normalizeTime(shop.openingTime),
                close: normalizeTime(shop.closingTime),
                isOpen: true,
            };
        }
        return null;
    }
    const now = getNowInIST();
    const dayKey = JS_DAY_TO_KEY[now.getDay()];
    return hours[dayKey] ?? null;
}
function isWithinSchedule(shop) {
    const schedule = getTodaySchedule(shop);
    if (!schedule || !schedule.isOpen)
        return false;
    const now = getNowInIST();
    const current = now.getHours() * 60 + now.getMinutes();
    const open = timeToMinutes(schedule.open);
    const close = timeToMinutes(schedule.close);
    if (open <= close) {
        return current >= open && current <= close;
    }
    return current >= open || current <= close;
}
function isShopCurrentlyOpen(shop) {
    const override = shop.manualOverride ?? shop_entity_1.ManualOverride.FORCE_CLOSED;
    if (override === shop_entity_1.ManualOverride.FORCE_CLOSED)
        return false;
    if (override === shop_entity_1.ManualOverride.FORCE_OPEN)
        return true;
    return isWithinSchedule(shop);
}
function getShopHoursStatus(shop) {
    const override = shop.manualOverride ?? shop_entity_1.ManualOverride.FORCE_CLOSED;
    const isCurrentlyOpen = isShopCurrentlyOpen(shop);
    const schedule = getTodaySchedule(shop);
    let statusMessage;
    if (override === shop_entity_1.ManualOverride.FORCE_CLOSED) {
        statusMessage = 'Manually closed — tap to reopen';
    }
    else if (override === shop_entity_1.ManualOverride.FORCE_OPEN) {
        statusMessage = 'Open now (manual override)';
    }
    else if (isCurrentlyOpen && schedule) {
        statusMessage = `Open until ${formatTime12h(schedule.close)}`;
    }
    else if (schedule?.isOpen) {
        statusMessage = `Closed — opens at ${formatTime12h(schedule.open)}`;
    }
    else {
        statusMessage = 'Closed today';
    }
    return {
        isCurrentlyOpen,
        statusMessage,
        manualOverride: override,
    };
}
function enrichShopWithHoursStatus(shop) {
    const status = getShopHoursStatus(shop);
    return {
        ...shop,
        ...status,
    };
}
function enrichProductWithShopHours(product) {
    if (!product.shop)
        return product;
    return {
        ...product,
        shop: enrichShopWithHoursStatus(product.shop),
    };
}
function enrichProductsWithShopHours(products) {
    return products.map(enrichProductWithShopHours);
}
function migrateLegacyHoursToOperatingHours(shop) {
    const defaults = createDefaultOperatingHours();
    if (shop.operatingHours) {
        return shop.operatingHours;
    }
    if (shop.openingTime && shop.closingTime) {
        const schedule = {
            open: normalizeTime(shop.openingTime),
            close: normalizeTime(shop.closingTime),
            isOpen: true,
        };
        for (const key of DAY_KEYS) {
            if (key !== 'sunday') {
                defaults[key] = { ...schedule };
            }
        }
        defaults.sunday = { ...schedule, isOpen: false };
    }
    return defaults;
}
//# sourceMappingURL=shop-hours.util.js.map