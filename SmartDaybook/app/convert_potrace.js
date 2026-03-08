const potrace = require('potrace');
const fs = require('fs');

potrace.trace('assets/images/voxday_logo_transparent3.png', { color: '#ED1C24', optTolerance: 0.4 }, function(err, svg) {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  fs.writeFileSync('assets/images/voxday_logo.svg', svg);
  console.log('SVG generated successfully!');
});
