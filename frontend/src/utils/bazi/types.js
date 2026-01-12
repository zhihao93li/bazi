// frontend/src/utils/bazi/types.js
// This file is kept as a reference for types used in the Bazi calculator.
// Since this is a JS project, these types are not enforced but serve as documentation.

/**
 * @typedef {'metal' | 'wood' | 'water' | 'fire' | 'earth'} FiveElement
 * @typedef {'yin' | 'yang'} YinYang
 */

/**
 * @typedef {Object} HeavenlyStem
 * @property {string} chinese
 * @property {string} pinyin
 * @property {FiveElement} element
 * @property {YinYang} yinYang
 */

/**
 * @typedef {Object} EarthlyBranch
 * @property {string} chinese
 * @property {string} pinyin
 * @property {FiveElement} element
 * @property {YinYang} yinYang
 * @property {string} animal
 */

// ... and so on for other types if needed for JSDoc
export default {};
