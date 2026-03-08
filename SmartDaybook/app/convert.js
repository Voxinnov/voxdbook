const fs = require('fs');
const ImageTracer = require('imagetracerjs');

try {
  ImageTracer.imageToSVG(
    'assets/images/voxday_logo_transparent3.png',
    (svgString) => {
      fs.writeFileSync('assets/images/voxday_logo.svg', svgString);
      console.log('SVG created successfully!');
    },
    { corsenabled: false, qtres: 1, pathomit: 8 }
  );
} catch (e) {
  console.error('Error generating SVG:', e);
}
