const leftLong = -169.110266;
const topLat = 83.600842;
const rightLong = 190.486279;
const bottomLat = -55.902263;

const minX = 4.69;
const maxX = 1010.23;
const minY = 28.78;
const maxY = 651.46;

const mapWidth = maxX - minX;
const mapHeight = maxY - minY;

const sanMarino = { lat: 43.9333, long: 12.4500 };

function latToY(lat) {
    const rad = lat * Math.PI / 180;
    return Math.log(Math.tan(Math.PI / 4 + rad / 2));
}

const X = (sanMarino.long - leftLong) * (mapWidth / (rightLong - leftLong)) + minX;

const topY = latToY(topLat);
const bottomY = latToY(bottomLat);
const countryY = latToY(sanMarino.lat);

const Y = (topY - countryY) * (mapHeight / (topY - bottomY)) + minY;

console.log(`San Marino Coordinates: X=${X}, Y=${Y}`);
