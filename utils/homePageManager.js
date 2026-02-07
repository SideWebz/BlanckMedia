const fs = require('fs');
const path = require('path');

const slotsFile = path.join(__dirname, '../data/home-slots.json');

const readSlots = () => {
  try {
    const data = fs.readFileSync(slotsFile, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    return { header: { type: 'image', image_path: null, video_url: null }, slots: [] };
  }
};

const writeSlots = (data) => {
  fs.writeFileSync(slotsFile, JSON.stringify(data, null, 2));
};

const getHeader = () => {
  const data = readSlots();
  return data.header || { type: 'image', image_path: null, video_url: null };
};

const updateHeader = (updates) => {
  const data = readSlots();
  data.header = { ...data.header, ...updates };
  writeSlots(data);
  return data.header;
};

const getAllSlots = () => {
  const data = readSlots();
  let slots = data.slots || [];
  
  // Ensure we always have 3 slots
  while (slots.length < 3) {
    slots.push({
      id: slots.length + 1,
      type: 'image',
      image_path: null,
      video_url: null,
      projectId: null
    });
  }
  
  // Update the data if slots were added
  if (slots.length > data.slots.length) {
    data.slots = slots.slice(0, 3);
    writeSlots(data);
  }
  
  return slots.slice(0, 3); // Return only first 3
};

const getSlotById = (slotId) => {
  const data = readSlots();
  const slots = data.slots || [];
  return slots.find(s => s.id === parseInt(slotId));
};

const updateSlot = (slotId, updates) => {
  const data = readSlots();
  const slots = data.slots || [];
  const idx = slots.findIndex(s => s.id === parseInt(slotId));
  if (idx === -1) return null;
  
  slots[idx] = { ...slots[idx], ...updates };
  data.slots = slots;
  writeSlots(data);
  return slots[idx];
};

// Validate video URL
const isValidVideoUrl = (url) => {
  if (!url) return false;
  return url.includes('.mp4') || url.includes('.webm') || url.includes('.mov');
};

module.exports = {
  getHeader,
  updateHeader,
  getAllSlots,
  getSlotById,
  updateSlot,
  isValidVideoUrl
};
