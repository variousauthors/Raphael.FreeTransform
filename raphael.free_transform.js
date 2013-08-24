/*
 * Licensed under the MIT license:
 * http://www.opensource.org/licenses/mit-license.php
 *
 */
(function (root, factory) {
  if ( typeof define === 'function' && define.amd ) {
    // AMD. Register as an anonymous module.
    define(['raphael'], function(Raphael) {
      // Use global variables if the locals are undefined.
      return factory(Raphael || root.Raphael);
    });
  } else {
    // RequireJS isn't being used. Assume underscore and backbone are loaded in <script> tags
    factory(Raphael);
  }
}(this, function(Raphael) {
  Raphael.fn.transformIcon = function(img, x, y, r){
    var icon = this.set();
    icon.push(this.circle(x, y, r).attr({
      fill: '#99b',
      stroke: '#446',
      'fill-opacity': 0.85
    }));
    icon.push(this.image(img, x-r, y-r, 2 * r, 2 * r));
    // icon.draggable();
    icon.attr = function(obj) {
      this[0].attr(obj);
      if(obj.cx){
        obj.x = obj.cx - r;
      }
      if(obj.cy){
        obj.y = obj.cy - r;
      }
      this[1].attr(obj);
      return this;
    };

    icon.attrs = icon[0].attrs;
    return icon;
  };

  Raphael.fn.freeTransform = function(subject, options, callback) {
    // Enable method chaining
    if ( subject.freeTransform ) { return subject.freeTransform; }

    // Add Array.map if the browser doesn't support it
    if ( !Array.prototype.hasOwnProperty('map') ) {
      Array.prototype.map = function(callback, arg) {
        var i, mapped = [];

        for ( i in this ) {
          if ( this.hasOwnProperty(i) ) {
            mapped[i] = callback.call(arg, this[i], i, this);
          }
        }

        return mapped;
      };
    }

    // Add Array.indexOf if not builtin
    if ( !Array.prototype.hasOwnProperty('indexOf') ) {
      Array.prototype.indexOf = function(obj, start) {
        for ( var i = ( start || 0 ), j = this.length; i < j; i++ ) {
          if ( this[i] === obj ) {
            return i;
          }
        }

        return -1;
      };
    }

    var
    paper = this,
    bbox  = subject.getBBox(true)
    ;

    var ft = subject.freeTransform = {
      // Keep track of transformations
      attrs: {
        x: bbox.x,
        y: bbox.y,
        size: { x: bbox.width, y: bbox.height },
        center: { x: bbox.x + bbox.width / 2, y: bbox.y + bbox.height / 2 },
        rotate: 0,
        scale: { x: 1, y: 1 },
        translate: { x: 0, y: 0 },
        ratio: 1
      },
      axes: null,
      bbox: null,
      callback: null,
      items: [],
      handles: { center: null, east: null, south: null, west: null, north: null },
      offset: {
        rotate: 0,
        scale: { x: 1, y: 1 },
        translate: { x: 0, y: 0 }
      },
      opts: {
        animate: false,
        attrs: { fill: '#fff', stroke: '#000' },
        boundary: { x: paper._left || 0, y: paper._top || 0, width: null, height: null },
        distance: 1.3,
        drag: true,
        draw: false,
        keepRatio: false,
        range: { rotate: [ -180, 180 ], scale: [ -99999, 99999 ] },
        rotate: true,
        scale: true,
        evented: false,
        snap: { rotate: 0, scale: 0, drag: 0 },
        snapDist: { rotate: 0, scale: 0, drag: 7 },
        size: 5,
        handle_images: { center: null, east: null, south: null, west: null, north: null },
        handle_classes: { center: null, east: null, south: null, west: null, north: null }
      },
      subject: subject
    };

    /**
     * Update handles based on the element's transformations
     */
    ft.updateHandles = function() {
      if ( ft.handles.bbox || ft.opts.rotate.indexOf('self') >= 0 ) {
        var corners = getBBox();
      }

      // Get the element's rotation
      // ZIGGY: x and y here are the rotational position of the
      // x and y handles
      // ZIGGY: we could probably relabel these "east" and "south" and
      // then add in a "west" for our additional control
      // ZIGGY: the names are "x" and "y" so that we can used axis to
      // dereference them
      var rad = {
        east: ( ft.attrs.rotate      ) * Math.PI / 180,
        south: ( ft.attrs.rotate + 90 ) * Math.PI / 180,
        west: ( ft.attrs.rotate + 180 ) * Math.PI / 180,
        north: ( ft.attrs.rotate + 270 ) * Math.PI / 180
      };

      // ZIGGY: radius gets used again WAY down below
      var radius = {
        east: ft.attrs.size.x / 2 * ft.attrs.scale.x,
        south: ft.attrs.size.y / 2 * ft.attrs.scale.y,
        west: ft.attrs.size.x / 2 * ft.attrs.scale.x,
        north: ft.attrs.size.x / 2 * ft.attrs.scale.y
      };

      ft.axes.map(function(axis) {
        if ( ft.handles[axis] ) {
          // ZIGGY: recall that (x, y) = (r * cos(theta), r * sin(theta))
          // here r = radius[axis] * distance, where presumably distance decides the distance of the handle from the figure
          var
          cx = ft.attrs.center.x + ft.attrs.translate.x + radius[axis] * ft.opts.distance * Math.cos(rad[axis]),
          cy = ft.attrs.center.y + ft.attrs.translate.y + radius[axis] * ft.opts.distance * Math.sin(rad[axis])
          ;

          // Keep handle within boundaries
          // ZIGGY: clamp function Math.max(lower, Math.min(x, upper))
          if ( ft.opts.boundary ) {
            cx = Math.max(Math.min(cx, ft.opts.boundary.x + ( ft.opts.boundary.width  || getPaperSize().x )), ft.opts.boundary.x);
            cy = Math.max(Math.min(cy, ft.opts.boundary.y + ( ft.opts.boundary.height || getPaperSize().y )), ft.opts.boundary.y);
          }

          ft.handles[axis].disc.attr({ cx: cx, cy: cy });

          ft.handles[axis].line.toFront().attr({
            path: [ [ 'M', ft.attrs.center.x + ft.attrs.translate.x, ft.attrs.center.y + ft.attrs.translate.y ],
                    [ 'L', ft.handles[axis].disc.attrs.cx, ft.handles[axis].disc.attrs.cy ]
            ]
          });

          ft.handles[axis].disc.toFront();
        }
      });

      // ZIGGY if there is a bbox at all
      // then stroke out its rotated corners
      // (we got them above with getBBox)
      if ( ft.bbox ) {
        ft.bbox.toFront().attr({
          path: [
            [ 'M', corners[0].x, corners[0].y ],
            [ 'L', corners[1].x, corners[1].y ],
            [ 'L', corners[2].x, corners[2].y ],
            [ 'L', corners[3].x, corners[3].y ],
            [ 'L', corners[0].x, corners[0].y ]
          ]
        });

        // Allowed x, y scaling directions for bbox handles
        var bboxHandleDirection = [
          [ -1, -1 ], [ 1, -1 ], [ 1, 1 ], [ -1, 1 ],
          [  0, -1 ], [ 1,  0 ], [ 0, 1 ], [ -1, 0 ]
        ];

        if ( ft.handles.bbox ) {
          ft.handles.bbox.map(function (handle, i) {
            var cx, cy, j, k;

            // ZIGGY: this is fairly self explanatory
            if ( handle.isCorner ) {
              cx = corners[i].x;
              cy = corners[i].y;
            } else {
              j  = i % 4;
              k  = ( j + 1 ) % corners.length;
              cx = ( corners[j].x + corners[k].x ) / 2;
              cy = ( corners[j].y + corners[k].y ) / 2;
            }

            handle.element.toFront()
            .attr({
              x: cx - ( handle.isCorner ? ft.opts.size.bboxCorners : ft.opts.size.bboxSides ),
              y: cy - ( handle.isCorner ? ft.opts.size.bboxCorners : ft.opts.size.bboxSides )
            })
            .transform('R' + ft.attrs.rotate)
            ;

            handle.x = bboxHandleDirection[i][0];
            handle.y = bboxHandleDirection[i][1];
          });
        }
      }

      // ZIGGY: here radius gets dereferenced and we use the max of the radii
      if ( ft.circle ) {
        ft.circle.attr({
          cx: ft.attrs.center.x + ft.attrs.translate.x,
          cy: ft.attrs.center.y + ft.attrs.translate.y,
          r:  Math.max(radius.east, radius.south, radius.west, radius.north) * ft.opts.distance
        });
      }

      if ( ft.handles.center ) {
        ft.handles.center.disc.toFront().attr({
          cx: ft.attrs.center.x + ft.attrs.translate.x,
          cy: ft.attrs.center.y + ft.attrs.translate.y
        });
      }

      // ZIGGY: there doesn't seem to be a way for rotate to have 'self'
      // possible value are 'axisX' and 'axisY'
      if ( ft.opts.rotate.indexOf('self') >= 0 ) {
        console.log("somehow this got called");
        radius = Math.max(
          Math.sqrt(Math.pow(corners[1].x - corners[0].x, 2) + Math.pow(corners[1].y - corners[0].y, 2)),
          Math.sqrt(Math.pow(corners[2].x - corners[1].x, 2) + Math.pow(corners[2].y - corners[1].y, 2))
        ) / 2;
      }

      return ft;
    };

    /**
     * Add handles
     */
    ft.showHandles = function() {
      ft.hideHandles();

      // ZIGGY: give each handle a line and a disc
      ft.axes.map(function(axis) {
        ft.handles[axis] = {};

        ft.handles[axis].line = paper
        .path([ 'M', ft.attrs.center.x, ft.attrs.center.y ])
        .attr({
          stroke: ft.opts.attrs.stroke,
          'stroke-dasharray': '- ',
          opacity: .5
        });

        if (ft.opts.handle_images[axis]) {
          ft.handles[axis].disc = paper
          .transformIcon(ft.opts.handle_images[axis], ft.attrs.center.x, ft.attrs.center.y, ft.opts.size.axes)
          .attr(ft.opts.attrs)
          ;
        } else {
          ft.handles[axis].disc = paper
          .circle(ft.attrs.center.x, ft.attrs.center.y, ft.opts.size.axes)
          .attr(ft.opts.attrs)
          ;
        }

        // ZIGGY: attach event handler to the evented handles
        if (ft.opts.evented) {
          if (ft.opts.evented.indexOf('axis' + axis.toUpperCase()) !== -1) {
            ft.handles[axis].disc.click(function() {
              console.log("click");
            });
          }
        }
      });

      // ZIGGY mark off a bounding box, potentially with scaling handles
      if ( ft.opts.draw.indexOf('bbox') >= 0 ) {
        ft.bbox = paper
        .path('')
        .attr({
          stroke: ft.opts.attrs.stroke,
          'stroke-dasharray': '- ',
          opacity: .5
        })
        ;

        // ZIGGY this seems to be where handles.bbox gets initialized
        ft.handles.bbox = [];

        var i, handle;

        // ZIGGY iterate from (0, 4), or (0, 8) or (4, 8) depending on whether you have cornerHandles, sideHandler, or both
        for ( i = ( ft.opts.scale.indexOf('bboxCorners') >= 0 ? 0 : 4 ); i < ( ft.opts.scale.indexOf('bboxSides') === -1 ? 4 : 8 ); i ++ ) {
          handle = {};

          // first we do corners, alternating x and y designation
          // then we do sides, again alternating
          handle.axis     = i % 2 ? 'x' : 'y';
          handle.isCorner = i < 4;

          handle.element = paper
          .rect(ft.attrs.center.x,
                ft.attrs.center.y,
                ft.opts.size[handle.isCorner ? 'bboxCorners' : 'bboxSides' ] * 2,
                ft.opts.size[handle.isCorner ? 'bboxCorners' : 'bboxSides' ] * 2)
          .attr(ft.opts.attrs)
          ;

          ft.handles.bbox[i] = handle;
        }
      }

      // ZIGGY mark off a bounding circle, with no handles
      if ( ft.opts.draw.indexOf('circle') !== -1 ) {
        ft.circle = paper
        .circle(0, 0, 0)
        .attr({
          stroke: ft.opts.attrs.stroke,
          'stroke-dasharray': '- ',
          opacity: .3
        })
        ;
      }

      // ZIGGY if there is a handle in the center
      if ( ft.opts.drag.indexOf('center') !== -1 ) {
        ft.handles.center = {};

        ft.handles.center.disc = paper
        .circle(ft.attrs.center.x, ft.attrs.center.y, ft.opts.size.center)
        .attr(ft.opts.attrs)
        ;
      }

      // Drag x, y handles
      ft.axes.map(function(axis) {
        if ( !ft.handles[axis] ) {
          // ZIGGY: no handles NOP
          return;
        }

        // ZIGGY: here again the axis is being used to build strings
        // we could replace axisX and axisY with axisWest and axisNorth... but
        // that is a little less semantic
        var
        rotate = ft.opts.rotate.indexOf('axis' + axis.toUpperCase()) !== -1,
        scale  = ft.opts.scale .indexOf('axis' + axis.toUpperCase()) !== -1
        ;

        ft.handles[axis].disc.drag(function(dx, dy) {
          // viewBox might be scaled
          if ( ft.o.viewBoxRatio ) {
            dx *= ft.o.viewBoxRatio.x;
            dy *= ft.o.viewBoxRatio.y;
          }

          // ZIGGY:QUESTION: center of the handle disc?
          var
          cx = dx + ft.handles[axis].disc.ox,
          cy = dy + ft.handles[axis].disc.oy
          ;

          // ZIGGY:QUESTION: is this like, shrink vs grow?
          // oh or maybe: if you stretch past the center, your shrink
          // becomes a grow! hmm...
          var mirrored = {
            east: ft.o.scale.x < 0,
            south: ft.o.scale.y < 0,
            west: ft.o.scale.x < 0,
            north: ft.o.scale.y < 0
          };

          // ZIGGY if this handle allows rotate
          if ( rotate ) {
            // ZIGGY then determine the angle of rotation achieved
            // SOH CAH TOA, so tangent(theta) = o/a = y/x
            // and theta = arctan(y/x) (atan2 is a binary arctan that takes y, and x)
            var rad = Math.atan2(cy - ft.o.center.y - ft.o.translate.y, cx - ft.o.center.x - ft.o.translate.x);

            // ZIGGY:RADAR convert to degrees
            // here we will need to be careful because "y" is used as a magic number
            // if x and y are east and south, and we take east as the default,
            // then each of south, west, and north will need an additional 90 degrees
            // consider: if I drag an object by its east handle, then position of the
            // handle can give us the radians of the rotation
            // if, on the other hand, I drag a south handle the handle by itself
            // tells me that I rotated the object by rad + 90 degrees
            var handle_offset;
            switch(axis) {
              case 'east' : handle_offset = 0; break;
              case 'south': handle_offset = 90; break;
              case 'west':  handle_offset = 180; break;
              case 'north': handle_offset = 270; break;
            }

            ft.attrs.rotate = rad * 180 / Math.PI - handle_offset;

            // ZIGGY:QUESTION: not sure what this is
            if ( mirrored[axis] ) {
              ft.attrs.rotate -= 180;
            }
          }

          // Keep handle within boundaries
          if ( ft.opts.boundary ) {
            cx = Math.max(Math.min(cx, ft.opts.boundary.x + ( ft.opts.boundary.width  || getPaperSize().x )), ft.opts.boundary.x);
            cy = Math.max(Math.min(cy, ft.opts.boundary.y + ( ft.opts.boundary.height || getPaperSize().y )), ft.opts.boundary.y);
          }

          // ZIGGY:RADAR: ft.o is for offset
          // distance function sqrt((x_1 - x_2)^2 + (y_1 - y_2)^2)
          // this is used in scale below and is the distance of the scale gesture
          // I think I will move this into the if (scale) {} block
          var radius = Math.sqrt(Math.pow(cx - ft.o.center.x - ft.o.translate.x, 2) + Math.pow(cy - ft.o.center.y - ft.o.translate.y, 2));

          // ZIGGY: we need to access the property 'x' on scale based on whether
          // axis is horizontal or vertical
          if ( scale ) {
            var local_axis = getCartesianAxisForDirection(axis);
            ft.attrs.scale[local_axis] = radius / ( ft.o.size[local_axis] / 2 * ft.opts.distance );

            // ZIGGY:QUESTION again this seems to indicate that mirrored means
            // "your shrink became a grow"
            if ( mirrored[axis] ) {
              ft.attrs.scale[local_axis] *= -1;
            }
          }

          // ZIGGY:RADAR I think we can safely ignore this function, since it never refers to 'axis'
          applyLimits();

          // Maintain aspect ratio
          // ZIGGY:RADAR this is another place that will need some work
          // probably just map from 'north'/'south' to "y" within the keepRatio function
          if ( ft.opts.keepRatio.indexOf('axis' + axis.toUpperCase()) !== -1 ) {
            keepRatio(axis);
          } else {
            ft.attrs.ratio = ft.attrs.scale.x / ft.attrs.scale.y;
          }

          if ( ft.attrs.scale.x && ft.attrs.scale.y ) { ft.apply(); }

          asyncCallback([ rotate ? 'rotate' : null, scale ? 'scale' : null ]);
        }, function() {
          // Offset values
          ft.o = cloneObj(ft.attrs);

          if ( paper._viewBox ) {
            ft.o.viewBoxRatio = {
              x: paper._viewBox[2] / getPaperSize().x,
              y: paper._viewBox[3] / getPaperSize().y
            };
          }

          ft.handles[axis].disc.ox = this.attrs.cx;
          ft.handles[axis].disc.oy = this.attrs.cy;

          asyncCallback([ rotate ? 'rotate start' : null, scale ? 'scale start' : null ]);
        }, function() {
          asyncCallback([ rotate ? 'rotate end'   : null, scale ? 'scale end'   : null ]);
        });
      });

      // Drag bbox handles
      if ( ft.opts.draw.indexOf('bbox') >= 0 && ( ft.opts.scale.indexOf('bboxCorners') !== -1 || ft.opts.scale.indexOf('bboxSides') !== -1 ) ) {
        ft.handles.bbox.map(function(handle) {
          handle.element.drag(function(dx, dy) {
            // viewBox might be scaled
            if ( ft.o.viewBoxRatio ) {
              dx *= ft.o.viewBoxRatio.x;
              dy *= ft.o.viewBoxRatio.y;
            }

            var
            sin, cos, rx, ry, rdx, rdy, mx, my, sx, sy,
            previous = cloneObj(ft.attrs)
            ;

            sin = ft.o.rotate.sin;
            cos = ft.o.rotate.cos;

            // First rotate dx, dy to element alignment
            rx = dx * cos - dy * sin;
            ry = dx * sin + dy * cos;

            rx *= Math.abs(handle.x);
            ry *= Math.abs(handle.y);

            // And finally rotate back to canvas alignment
            rdx = rx *   cos + ry * sin;
            rdy = rx * - sin + ry * cos;

            ft.attrs.translate = {
              x: ft.o.translate.x + rdx / 2,
              y: ft.o.translate.y + rdy / 2
            };

            // Mouse position, relative to element center after translation
            mx = ft.o.handlePos.cx + dx - ft.attrs.center.x - ft.attrs.translate.x;
            my = ft.o.handlePos.cy + dy - ft.attrs.center.y - ft.attrs.translate.y;

            // Position rotated to align with element
            rx = mx * cos - my * sin;
            ry = mx * sin + my * cos;

            // Maintain aspect ratio
            if ( handle.isCorner && ft.opts.keepRatio.indexOf('bboxCorners') !== -1 ) {
              var
              ratio = ( ft.attrs.size.x * ft.attrs.scale.x ) / ( ft.attrs.size.y * ft.attrs.scale.y ),
              tdy = rx * handle.x * ( 1 / ratio ),
              tdx = ry * handle.y * ratio
              ;

              if ( tdx > tdy * ratio ) {
                rx = tdx * handle.x;
              } else {
                ry = tdy * handle.y;
              }
            }

            // Scale element so that handle is at mouse position
            sx = rx * 2 * handle.x / ft.o.size.x;
            sy = ry * 2 * handle.y / ft.o.size.y;

            ft.attrs.scale = {
              x: sx || ft.attrs.scale.x,
              y: sy || ft.attrs.scale.y
            };

            // Check boundaries
            if ( !isWithinBoundaries().x || !isWithinBoundaries().y ) { ft.attrs = previous; }

            applyLimits();

            // Maintain aspect ratio
            if ( ( handle.isCorner && ft.opts.keepRatio.indexOf('bboxCorners') !== -1 ) || ( !handle.isCorner && ft.opts.keepRatio.indexOf('bboxSides') !== -1 ) ) {
              keepRatio(handle.axis);

              var trans = {
                x: ( ft.attrs.scale.x - ft.o.scale.x ) * ft.o.size.x * handle.x,
                y: ( ft.attrs.scale.y - ft.o.scale.y ) * ft.o.size.y * handle.y
              };

              rx =   trans.x * cos + trans.y * sin;
              ry = - trans.x * sin + trans.y * cos;

              ft.attrs.translate.x = ft.o.translate.x + rx / 2;
              ft.attrs.translate.y = ft.o.translate.y + ry / 2;
            }

            ft.attrs.ratio = ft.attrs.scale.x / ft.attrs.scale.y;

            asyncCallback([ 'scale' ]);

            ft.apply();
          }, function() {
            var
            rotate = ( ( 360 - ft.attrs.rotate ) % 360 ) / 180 * Math.PI,
            handlePos = handle.element.attr(['x', 'y'])
            ;

            // Offset values
            ft.o = cloneObj(ft.attrs);

            ft.o.handlePos = {
              cx: handlePos.x + ft.opts.size[handle.isCorner ? 'bboxCorners' : 'bboxSides'],
              cy: handlePos.y + ft.opts.size[handle.isCorner ? 'bboxCorners' : 'bboxSides']
            };

            // Pre-compute rotation sin & cos for efficiency
            ft.o.rotate = {
              sin: Math.sin(rotate),
              cos: Math.cos(rotate)
            };

            if ( paper._viewBox ) {
              ft.o.viewBoxRatio = {
                x: paper._viewBox[2] / getPaperSize().x,
                y: paper._viewBox[3] / getPaperSize().y
              };
            }

            asyncCallback([ 'scale start' ]);
          }, function() {
            asyncCallback([ 'scale end' ]);
          });
        });
      }

      // Drag element and center handle
      var draggables = [];

      if ( ft.opts.drag.indexOf('self') >= 0 && ft.opts.scale.indexOf('self') === -1 && ft.opts.rotate.indexOf('self') === -1 ) {
        draggables.push(subject);
      }

      if ( ft.opts.drag.indexOf('center') >= 0 ) {
        draggables.push(ft.handles.center.disc);
      }

      draggables.map(function(draggable) {
        draggable.drag(function(dx, dy) {
          // viewBox might be scaled
          if ( ft.o.viewBoxRatio ) {
            dx *= ft.o.viewBoxRatio.x;
            dy *= ft.o.viewBoxRatio.y;
          }

          ft.attrs.translate.x = ft.o.translate.x + dx;
          ft.attrs.translate.y = ft.o.translate.y + dy;


          var bbox = cloneObj(ft.o.bbox);

          bbox.x += dx;
          bbox.y += dy;

          applyLimits(bbox);

          asyncCallback([ 'drag' ]);

          ft.apply();
        }, function() {
          // Offset values
          ft.o = cloneObj(ft.attrs);

          if ( ft.opts.snap.drag ) {
            ft.o.bbox = subject.getBBox();
          }

          // viewBox might be scaled
          if ( paper._viewBox ) {
            ft.o.viewBoxRatio = {
              x: paper._viewBox[2] / getPaperSize().x,
              y: paper._viewBox[3] / getPaperSize().y
            };
          }

          // ZIGGY:RADAR: will need to deal with this as well
          // actually... we may be able to ignore this?
          ft.axes.map(function(axis) {
            if ( ft.handles[axis] ) {
              ft.handles[axis].disc.ox = ft.handles[axis].disc.attrs.cx;
              ft.handles[axis].disc.oy = ft.handles[axis].disc.attrs.cy;
            }
          });

          asyncCallback([ 'drag start' ]);
        }, function() {
          asyncCallback([ 'drag end' ]);
        });
      });

      var
      rotate = ft.opts.rotate.indexOf('self') >= 0,
      scale  = ft.opts.scale .indexOf('self') >= 0
      ;

      if ( rotate || scale ) {
        subject.drag(function(dx, dy, x, y) {
          if ( rotate ) {
            var rad = Math.atan2(y - ft.o.center.y - ft.o.translate.y, x - ft.o.center.x - ft.o.translate.x);

            ft.attrs.rotate = ft.o.rotate + ( rad * 180 / Math.PI ) - ft.o.deg;
          }

          var mirrored = {
            x: ft.o.scale.x < 0,
            y: ft.o.scale.y < 0
          };

          if ( scale ) {
            var radius = Math.sqrt(Math.pow(x - ft.o.center.x - ft.o.translate.x, 2) + Math.pow(y - ft.o.center.y - ft.o.translate.y, 2));

            ft.attrs.scale.x = ft.attrs.scale.y = ( mirrored.x ? -1 : 1 ) * ft.o.scale.x + ( radius - ft.o.radius ) / ( ft.o.size.x / 2 );

            if ( mirrored.x ) { ft.attrs.scale.x *= -1; }
            if ( mirrored.y ) { ft.attrs.scale.y *= -1; }
          }

          applyLimits();

          ft.apply();

          asyncCallback([ rotate ? 'rotate' : null, scale ? 'scale' : null ]);
        }, function(x, y) {
          // Offset values
          ft.o = cloneObj(ft.attrs);

          ft.o.deg = Math.atan2(y - ft.o.center.y - ft.o.translate.y, x - ft.o.center.x - ft.o.translate.x) * 180 / Math.PI;

          ft.o.radius = Math.sqrt(Math.pow(x - ft.o.center.x - ft.o.translate.x, 2) + Math.pow(y - ft.o.center.y - ft.o.translate.y, 2));

          // viewBox might be scaled
          if ( paper._viewBox ) {
            ft.o.viewBoxRatio = {
              x: paper._viewBox[2] / getPaperSize().x,
              y: paper._viewBox[3] / getPaperSize().y
            };
          }

          asyncCallback([ rotate ? 'rotate start' : null, scale ? 'scale start' : null ]);
        }, function() {
          asyncCallback([ rotate ? 'rotate end'   : null, scale ? 'scale end'   : null ]);
        });
      }

      ft.updateHandles();

      return ft;
    };

    /**
     * Remove handles
     */
    ft.hideHandles = function(opts) {
      var opts = opts || {}

      if ( opts.undrag === undefined ) {
        opts.undrag = true;
      }

      if ( opts.undrag ) {
        ft.items.map(function(item) {
            item.el.undrag();
            });
      }

      if ( ft.handles.center ) {
        ft.handles.center.disc.remove();

        ft.handles.center = null;
      }

      // ZIGGY:RADAR again with the literals
      // this is not problem though, since we can just extend this
      // array to contain north south, etc
      [ 'east', 'south', 'west', 'north' ].map(function(axis) {
          if ( ft.handles[axis] ) {
          ft.handles[axis].disc.remove();
          ft.handles[axis].line.remove();

          ft.handles[axis] = null;
          }
      });

      if ( ft.bbox ) {
        ft.bbox.remove();

        ft.bbox = null;

        if ( ft.handles.bbox ) {
          ft.handles.bbox.map(function(handle) {
              handle.element.remove();
              });

          ft.handles.bbox = null;
        }
      }

      if ( ft.circle ) {
        ft.circle.remove();

        ft.circle = null;
      }

      return ft;
    };

    // Override defaults
    ft.setOpts = function(options, callback) {
      if ( callback !== undefined ) {
        ft.callback = typeof callback === 'function' ? callback : false;
      }

      var i, j;

      for ( i in options ) {
        if ( options[i] && options[i].constructor === Object ) {
          for ( j in options[i] ) {
            if ( options[i].hasOwnProperty(j) ) {
              ft.opts[i][j] = options[i][j];
            }
          }
        } else {
          ft.opts[i] = options[i];
        }
      }

      if ( ft.opts.animate   === true ) { ft.opts.animate   = { delay:   700, easing: 'linear' }; }
      if ( ft.opts.drag      === true ) { ft.opts.drag      = [ 'center', 'self' ]; }
      if ( ft.opts.keepRatio === true ) { ft.opts.keepRatio = [ 'bboxCorners', 'bboxSides' ]; }
      if ( ft.opts.rotate    === true ) { ft.opts.rotate    = [ 'axisEAST', 'axisSOUTH', 'axisWEST', 'axisNORTH']; }
      if ( ft.opts.scale     === true ) { ft.opts.scale     = [ 'axisEAST', 'axisSOUTH', 'axisWEST', 'axisNORTH', 'bboxCorners', 'bboxSides' ]; }

      [ 'drag', 'draw', 'keepRatio', 'rotate', 'scale' ].map(function(option) {
        if ( ft.opts[option] === false ) {
          ft.opts[option] = [];
        }
      });

      console.log(ft.opts.scale);
      console.log(ft.opts.rotate);
      console.log(ft.opts.evented);

      // ZIGGY: axis is used as a sort of label for the handles, it is always accompanied by
      // ft.handles[axis]. I think we could replace this with 'direction' and have an arbitrary
      // number of handles
      ft.axes = [];

      var merged_opts = ft.opts.rotate.concat(ft.opts.scale.concat(ft.opts.evented));
      console.log(merged_opts);

      if ( merged_opts.indexOf('axisEAST') >= 0) { ft.axes.push('east'); }
      if ( merged_opts.indexOf('axisSOUTH') >= 0) { ft.axes.push('south'); }
      if ( merged_opts.indexOf('axisWEST') >= 0) { ft.axes.push('west'); }
      if ( merged_opts.indexOf('axisNORTH') >= 0) { ft.axes.push('north'); }

      [ 'drag', 'rotate', 'scale' ].map(function(option) {
          if ( !ft.opts.snapDist[option] ) {
          ft.opts.snapDist[option] = ft.opts.snap[option];
          }
          });

      // Force numbers
      ft.opts.range = {
        rotate: [ parseFloat(ft.opts.range.rotate[0]), parseFloat(ft.opts.range.rotate[1]) ],
        scale:  [ parseFloat(ft.opts.range.scale[0]),  parseFloat(ft.opts.range.scale[1])  ]
      };

      ft.opts.snap = {
        drag:   parseFloat(ft.opts.snap.drag),
        rotate: parseFloat(ft.opts.snap.rotate),
        scale:  parseFloat(ft.opts.snap.scale)
      };

      ft.opts.snapDist = {
        drag:   parseFloat(ft.opts.snapDist.drag),
        rotate: parseFloat(ft.opts.snapDist.rotate),
        scale:  parseFloat(ft.opts.snapDist.scale)
      };

      if ( typeof ft.opts.size === 'string' ) {
        ft.opts.size = parseFloat(ft.opts.size);
      }

      if ( !isNaN(ft.opts.size) ) {
        ft.opts.size = {
          axes:        ft.opts.size,
          bboxCorners: ft.opts.size,
          bboxSides:   ft.opts.size,
          center:      ft.opts.size
        };
      }

      ft.showHandles();

      asyncCallback([ 'init' ]);

      return ft;
    };

    ft.setOpts(options, callback);

    /**
     * Apply transformations, optionally update attributes manually
     */
    ft.apply = function() {
      ft.items.map(function(item, i) {
        // Take offset values into account
        var
        center = {
          x: ft.attrs.center.x + ft.offset.translate.x,
          y: ft.attrs.center.y + ft.offset.translate.y
        },
        rotate    = ft.attrs.rotate - ft.offset.rotate,
        scale     = {
          x: ft.attrs.scale.x / ft.offset.scale.x,
          y: ft.attrs.scale.y / ft.offset.scale.y
        },
        translate = {
          x: ft.attrs.translate.x - ft.offset.translate.x,
          y: ft.attrs.translate.y - ft.offset.translate.y
        };

        if ( ft.opts.animate ) {
          asyncCallback([ 'animate start' ]);

          item.el.animate(
            { transform: [
            'R', rotate, center.x, center.y,
            'S', scale.x, scale.y, center.x, center.y,
            'T', translate.x, translate.y
          ] + ft.items[i].transformString },
          ft.opts.animate.delay,
          ft.opts.animate.easing,
          function() {
            asyncCallback([ 'animate end' ]);

            ft.updateHandles();
          }
          );
        } else {
          item.el.transform([
            'R', rotate, center.x, center.y,
            'S', scale.x, scale.y, center.x, center.y,
            'T', translate.x, translate.y
          ] + ft.items[i].transformString);

          asyncCallback([ 'apply' ]);

          ft.updateHandles();
        }
      });

      return ft;
    };

    /**
     * Clean exit
     */
    ft.unplug = function() {
      var attrs = ft.attrs;

      ft.hideHandles();

      // Goodbye
      delete subject.freeTransform;

      return attrs;
    };

    // Store attributes for each item
    function scan(subject) {
      ( subject.type === 'set' ? subject.items : [ subject ] ).map(function(item) {
        if ( item.type === 'set' ) {
          scan(item);
        } else {
          ft.items.push({
            el: item,
            attrs: {
              rotate:    0,
              scale:     { x: 1, y: 1 },
              translate: { x: 0, y: 0 }
            },
            transformString: item.matrix.toTransformString()
          });
        }
      });
    }

    scan(subject);

    // Get the current transform values for each item
    ft.items.map(function(item, i) {
      if ( item.el._ && item.el._.transform && typeof item.el._.transform === 'object' ) {
        item.el._.transform.map(function(transform) {
          if ( transform[0] ) {
            switch ( transform[0].toUpperCase() ) {
              case 'T':
                ft.items[i].attrs.translate.x += transform[1];
              ft.items[i].attrs.translate.y += transform[2];

              break;
              case 'S':
                ft.items[i].attrs.scale.x *= transform[1];
              ft.items[i].attrs.scale.y *= transform[2];

              break;
              case 'R':
                ft.items[i].attrs.rotate += transform[1];

              break;
            }
          }
        });
      }
    });

    // If subject is not of type set, the first item _is_ the subject
    if ( subject.type !== 'set' ) {
      ft.attrs.rotate    = ft.items[0].attrs.rotate;
      ft.attrs.scale     = ft.items[0].attrs.scale;
      ft.attrs.translate = ft.items[0].attrs.translate;

      ft.items[0].attrs = {
        rotate:    0,
        scale:     { x: 1, y: 1 },
        translate: { x: 0, y: 0 }
      };

      ft.items[0].transformString = '';
    }

    ft.attrs.ratio = ft.attrs.scale.x / ft.attrs.scale.y;

    /**
     * Get rotated bounding box
     */
    function getBBox() {
      var rad = {
        x: ( ft.attrs.rotate      ) * Math.PI / 180,
        y: ( ft.attrs.rotate + 90 ) * Math.PI / 180
      };

      var radius = {
        x: ft.attrs.size.x / 2 * ft.attrs.scale.x,
        y: ft.attrs.size.y / 2 * ft.attrs.scale.y
      };

      var
      corners = [],
      signs   = [ { x: -1, y: -1 }, { x: 1, y: -1 }, { x: 1, y: 1 }, { x: -1, y: 1 } ]
      ;

      signs.map(function(sign) {
        corners.push({
          x: ( ft.attrs.center.x + ft.attrs.translate.x + sign.x * radius.x * Math.cos(rad.x) ) + sign.y * radius.y * Math.cos(rad.y),
          y: ( ft.attrs.center.y + ft.attrs.translate.y + sign.x * radius.x * Math.sin(rad.x) ) + sign.y * radius.y * Math.sin(rad.y)
        });
      });

      return corners;
    }

    /**
     * Get dimension of the paper
     */
    function getPaperSize() {
      var match = {
        x: /^([0-9]+)%$/.exec(paper.width),
        y: /^([0-9]+)%$/.exec(paper.height)
      };

      return {
        x: match.x ? paper.canvas.clientWidth  || paper.canvas.parentNode.clientWidth  * parseInt(match.x[1], 10) * 0.01 : paper.canvas.clientWidth  || paper.width,
        y: match.y ? paper.canvas.clientHeight || paper.canvas.parentNode.clientHeight * parseInt(match.y[1], 10) * 0.01 : paper.canvas.clientHeight || paper.height
      };
    }

    /**
     * Apply limits
     */
    function applyLimits(bbox) {
      // Snap to grid
      if ( bbox && ft.opts.snap.drag ) {
        var
        x    = bbox.x,
        y    = bbox.y,
        dist = { x: 0, y: 0 },
        snap = { x: 0, y: 0 }
        ;

        [ 0, 1 ].map(function() {
          // Top and left sides first
          dist.x = x - Math.round(x / ft.opts.snap.drag) * ft.opts.snap.drag;
          dist.y = y - Math.round(y / ft.opts.snap.drag) * ft.opts.snap.drag;

          if ( Math.abs(dist.x) <= ft.opts.snapDist.drag ) { snap.x = dist.x; }
          if ( Math.abs(dist.y) <= ft.opts.snapDist.drag ) { snap.y = dist.y; }

          // Repeat for bottom and right sides
          x += bbox.width  - snap.x;
          y += bbox.height - snap.y;
        });

        ft.attrs.translate.x -= snap.x;
        ft.attrs.translate.y -= snap.y;
      }

      // Keep center within boundaries
      if ( ft.opts.boundary ) {
        var b = ft.opts.boundary;

        b.width  = b.width  || getPaperSize().x;
        b.height = b.height || getPaperSize().y;

        if ( ft.attrs.center.x + ft.attrs.translate.x < b.x            ) { ft.attrs.translate.x += b.x -            ( ft.attrs.center.x + ft.attrs.translate.x ); }
        if ( ft.attrs.center.y + ft.attrs.translate.y < b.y            ) { ft.attrs.translate.y += b.y -            ( ft.attrs.center.y + ft.attrs.translate.y ); }
        if ( ft.attrs.center.x + ft.attrs.translate.x > b.x + b.width  ) { ft.attrs.translate.x += b.x + b.width  - ( ft.attrs.center.x + ft.attrs.translate.x ); }
        if ( ft.attrs.center.y + ft.attrs.translate.y > b.y + b.height ) { ft.attrs.translate.y += b.y + b.height - ( ft.attrs.center.y + ft.attrs.translate.y ); }
      }

      // Snap to angle, rotate with increments
      dist = Math.abs(ft.attrs.rotate % ft.opts.snap.rotate);
      dist = Math.min(dist, ft.opts.snap.rotate - dist);

      if ( dist < ft.opts.snapDist.rotate ) {
        ft.attrs.rotate = Math.round(ft.attrs.rotate / ft.opts.snap.rotate) * ft.opts.snap.rotate;
      }

      // Snap to scale, scale with increments
      dist = {
        x: Math.abs(( ft.attrs.scale.x * ft.attrs.size.x ) % ft.opts.snap.scale),
        y: Math.abs(( ft.attrs.scale.y * ft.attrs.size.x ) % ft.opts.snap.scale)
      };

      dist = {
        x: Math.min(dist.x, ft.opts.snap.scale - dist.x),
        y: Math.min(dist.y, ft.opts.snap.scale - dist.y)
      };

      if ( dist.x < ft.opts.snapDist.scale ) {
        ft.attrs.scale.x = Math.round(ft.attrs.scale.x * ft.attrs.size.x / ft.opts.snap.scale) * ft.opts.snap.scale / ft.attrs.size.x;
      }

      if ( dist.y < ft.opts.snapDist.scale ) {
        ft.attrs.scale.y = Math.round(ft.attrs.scale.y * ft.attrs.size.y / ft.opts.snap.scale) * ft.opts.snap.scale / ft.attrs.size.y;
      }

      // Limit range of rotation
      if ( ft.opts.range.rotate ) {
        var deg = ( 360 + ft.attrs.rotate ) % 360;

        if ( deg > 180 ) { deg -= 360; }

        if ( deg < ft.opts.range.rotate[0] ) { ft.attrs.rotate += ft.opts.range.rotate[0] - deg; }
        if ( deg > ft.opts.range.rotate[1] ) { ft.attrs.rotate += ft.opts.range.rotate[1] - deg; }
      }

      // Limit scale
      if ( ft.opts.range.scale ) {
        if ( ft.attrs.scale.x * ft.attrs.size.x < ft.opts.range.scale[0] ) {
          ft.attrs.scale.x = ft.opts.range.scale[0] / ft.attrs.size.x;
        }

        if ( ft.attrs.scale.y * ft.attrs.size.y < ft.opts.range.scale[0] ) {
          ft.attrs.scale.y = ft.opts.range.scale[0] / ft.attrs.size.y;
        }

        if ( ft.attrs.scale.x * ft.attrs.size.x > ft.opts.range.scale[1] ) {
          ft.attrs.scale.x = ft.opts.range.scale[1] / ft.attrs.size.x;
        }

        if ( ft.attrs.scale.y * ft.attrs.size.y > ft.opts.range.scale[1] ) {
          ft.attrs.scale.y = ft.opts.range.scale[1] / ft.attrs.size.y;
        }
      }
    }

    function isWithinBoundaries() {
      return {
        x: ft.attrs.scale.x * ft.attrs.size.x >= ft.opts.range.scale[0] && ft.attrs.scale.x * ft.attrs.size.x <= ft.opts.range.scale[1],
        y: ft.attrs.scale.y * ft.attrs.size.y >= ft.opts.range.scale[0] && ft.attrs.scale.y * ft.attrs.size.y <= ft.opts.range.scale[1]
      };
    }

    function keepRatio(axis) {
      if ( axis === 'east' || axis === 'west' ) {
        ft.attrs.scale.y = ft.attrs.scale.x / ft.attrs.ratio;
      } else {
        ft.attrs.scale.x = ft.attrs.scale.y * ft.attrs.ratio;
      }
    }

    /**
     * Recursive copy of object
     */
    function cloneObj(obj) {
      var i, clone = {};

      for ( i in obj ) {
        clone[i] = typeof obj[i] === 'object' ? cloneObj(obj[i]) : obj[i];
      }

      return clone;
    }

    var timeout = false;

    /**
     * Call callback asynchronously for better performance
     */
    function asyncCallback(e) {
      if ( ft.callback ) {
        // Remove empty values
        var events = [];

        e.map(function(e, i) { if ( e ) { events.push(e); } });

        clearTimeout(timeout);

        setTimeout(function() { if ( ft.callback ) { ft.callback(ft, events); } }, 1);
      }
    }

    /**
     * Given a direction like 'north' returns 'x' or 'y' depending on whether
     * the given direction is a 'vertical' or 'horizontal' direction
     */
    function getCartesianAxisForDirection(direction) {
      var axis = '';

      switch(direction) {
        case 'north': axis = 'y'; break;
        case 'south': axis = 'y'; break;
        case 'east' : axis = 'x'; break;
        case 'west' : axis = 'x'; break;
      }

      return axis;
    }

    ft.updateHandles();

    // Enable method chaining
    return ft;
  };
}));
