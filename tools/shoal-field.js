/* Shared by the render sources (og, banner, avatar): draws a still shoal of
   chevron fish on a canvas, seeded so every render is identical. Three schools
   in the site's sentiment colours, swirling around their centres, like the
   hero after "Rehearse a launch". Not shipped with the site. */
function shoalField(cv, opts) {
  var W = cv.width = opts.w, H = cv.height = opts.h, c = cv.getContext('2d');
  var seed = opts.seed || 7;
  var rnd = function () { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
  c.fillStyle = 'rgba(247,251,250,.12)';
  for (var i = 0; i < (opts.snow || 120); i++) { var s = .4 + rnd() * .9; c.fillRect(rnd() * W, rnd() * H, s, s); }
  c.globalCompositeOperation = 'lighter';
  c.lineCap = 'round'; c.lineJoin = 'round';
  var cols = ['94,242,214', '245,200,76', '255,122,89'];
  opts.schools.forEach(function (sc) {
    for (var k = 0; k < sc.n; k++) {
      var a = rnd() * 6.283, r = Math.sqrt(rnd()) * sc.r;
      var x = sc.x + Math.cos(a) * r * 1.35, y = sc.y + Math.sin(a) * r;
      var dir = a + (sc.cw ? 1.5708 : -1.5708) + (rnd() - .5) * .5;
      var z = rnd(), len = (2.2 + z * 3.4) * (opts.scale || 1), w = len * .55;
      var ux = Math.cos(dir), uy = Math.sin(dir), bx = x - ux * len, by = y - uy * len;
      var lit = rnd() < .06;
      c.strokeStyle = 'rgba(' + cols[sc.g] + ',' + (lit ? .95 : .28 + z * .55) + ')';
      c.lineWidth = (lit ? 1.7 : .8 + z * .6) * (opts.scale || 1);
      c.beginPath(); c.moveTo(bx - uy * w, by + ux * w); c.lineTo(x, y); c.lineTo(bx + uy * w, by - ux * w); c.stroke();
    }
  });
}
