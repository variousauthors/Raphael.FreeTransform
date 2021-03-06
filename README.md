Raphaël.FreeTransform
====================

  Free transform tool for [Raphaël 2.0](http://raphaeljs.com/) elements and sets with many options. Supports snap-to-grid dragging, scaling and rotating with a specified interval and range.

  ![Screenshot](https://github.com/ElbertF/Raphael.FreeTransform/raw/master/screenshot.png)

  *Licensed under the [MIT license](http://www.opensource.org/licenses/mit-license.php).*

Demo
----

  http://alias.io/raphael/free_transform/

Examples
--------

```html
<script type="text/javascript" src="raphael-min.js"></script>
<script type="text/javascript" src="raphael.free_transform.js"></script>

<div id="holder" style="height: 100%;"></div>

<script type="text/javascript">
    var paper = Raphael(0, 0, 500, 500);

    var rect = paper
        .rect(350, 200, 100, 100)
        .attr('fill', '#f00')
        ;

    // Add freeTransform
    var ft = paper.freeTransform(rect);

    // Hide freeTransform handles
    ft.hideHandles();

    // Show hidden freeTransform handles
    ft.showHandles();

    // Apply transformations programmatically
    // ft.attrs.rotate = 45;

    ft.apply();

    // Remove freeTransform completely
    ft.unplug();

    // Add freeTransform with options and callback
    ft = paper.freeTransform(rect, {
      draw: ['circle'],
      drag:['self'],
      keepRatio: ['axisNORTH'],
      attrs: { fill: 'green', stroke: 'blue' },
      rotate: ['axisSOUTH'],
      scale: ['axisNORTH'],
      evented: ['axisWEST', 'axisSOUTH'],
      snap: { scale: 0.0001, rotate: 0 },
      handles: {
        east: {},
        south: { image: 'images/rotate_icon.png', size: 15 },
        west: { attrs: { fill: 'red' }, classes: 'slave', image: 'images/delete_icon.png', distance: 2 },
        north: { classes: 'master', image: 'images/scale_icon.png', size: 15 },
      },
      size: 10,
      distance: 1.5,
    }, function(ft, events) {
      // callback console.log(ft.attrs);
    });

</script>
```

Options
-------

#### `animate: true | { delay: num, easing: string } | false`

Animate transformations. Works best in combination with `apply()` (see the functions section below).

Default: `{ delay: 700, easing: 'linear' }`


#### `attrs: { fill: hex, stroke: hex }`

Sets the attributes of the handles.

Default: `{ fill: '#fff', stroke: '#000' }`


#### `boundary: { x: int, y: int, width: int, height: int } | false`

Limits the drag area of the handles.

Default: dimensions of the paper


#### `distance: num`

Sets the distance of the handles from the center of the element (`num` times radius).

Default: `1.3`


#### `drag: true | [ 'center', 'self' ] | false`

Enables/disables dragging.

Default: `[ 'center', 'self' ]`


#### `draw: [ 'bbox', 'circle' ]`

Additional elements to draw.

Default: `false`


#### `keepRatio: true | [ 'axisEAST', 'axisSOUTH', 'axisWEST', 'axisNORTH', 'bboxCorners', 'bboxSides' ] | false`

Scale axes together or individually. Values like 'axisNORTH' force the aspect
ratio when the northern handle is used to perform scaling; handles not specified
can still be used for scaling only one axis or the other.

Default: `false`


#### `range: { rotate: [ num, num ], scale: [ num, num ] }`

Limit the range of transformation.

Default: `{ rotate: [ -180, 180 ], scale: [ 0, 99999 ] }`


#### `rotate: true | [ 'axisEAST', 'axisSOUTH', 'axisWEST', 'axisNORTH', 'bboxCorners', 'bboxSides' ] | false`

Enables/disables rotating. Values like 'axisNORTH' enable control of rotational transformations on
just the selected handle, while 'bboxCorners' enables rotation for all corner handles.

Default: `[ 'axisEAST', 'axisSOUTH', 'axisWEST', 'axisNORTH']`


#### `scale: true | [ 'axisEAST', 'axisSOUTH', 'axisWEST', 'axisNORTH', 'bboxCorners', 'bboxSides' ] | false`

Enables/disables scaling. When 'axisNORTH' or 'axisSOUTH' are provided,
the handle controls scaling along the y-axis, in both directions at once.
When 'axisEAST' or 'axisWEST' are provided, scaling is along the x-axis.
Values like 'bboxCorners' enable scaling by dragging corner handles.

Default: `[ 'axisEAST', 'axisSOUTH', 'axisWEST', 'axisNORTH', 'bboxCorners', 'bboxSides' ]`

#### `evented: true | [ 'axisEAST', 'axisSOUTH', 'axisWEST', 'axisNORTH' ] | false`

When evented is set, the given handles are registered to receive click events
from the browser. This option can be combined with rotate and scale, or it
can be used on its own to create a handle that has not transformation but
receives click events.

This option is most useful in combination with `handle_classes` described below.

At the moment the handle only receives the event.

Default: false


#### `snap: { rotate: num, scale: num, drag: num }`: 

Snap transformations to num degrees (rotate) or pixels (scale, drag).

Default: `{ rotate: 0, scale: 0, drag: 0 }`


#### `snapDist: { rotate: num, scale: num, drag: num }`

Snap distance in degrees (rotate) or pixels (scale, drag).

Default: `{ rotate: 0, scale: 0, drag: 7 }`


#### `size: num | { axes: num, bboxCorners: num, bboxSides: num, center: num }`

Sets the radius of the handles in pixels.

Default: `5`

### `handles: { center: object, east: object, south: object, west: object, north: object }`

Trust me, there will be times when symmetry just won't cut it. If you need to
specify some attributes on one handle or another, such as size or distance, you
can pass just that attribute into the `handles` hash for just that handle, and
voila!

Check the example above for a detailed... example.

The options available for the handles hash are:

####  `image: string`

Sets the image to be used for this handle. If only some of the handles are
given images, the rest will be drawn normally. The images will be scaled
to match the axis size option given above.

Default: false


#### `attrs: { fill: hex, stroke: hex }`

Sets the attributes of the given handles individually, in addition to any attributes
previously set with `attrs`. The given values cascade over the previosuly set
attrs, so if `attrs: { fill: 'red', stroke: 'blue' }` is set globally, and `attrs: { fill: 'blue' }`
is set for just the east handle, then the east handle will have a blue fill and a blue outline.

Default: false


####  `classes: string`

Sets classes on the handle. This can be useful!

Default: false


####  `size: number`

Sets size for just the specified handles.

Default: false


####  `distance: number`

Sets distance for just the specified handles.

Default: false


Callback
--------

A callback function can be specified to capture changes and events.


Functions
---------

#### `apply()`

Programmatically apply transformations (see the example above).


#### `hideHandles( opts )`

Removes handles but keeps values set by the plugin in memory. By
default removes all drag events from the elements. If you'd like to
keep then while the handles are hidden, pass ``{undrag: false}`` to
hideHandles().


#### `showHandles()`

Shows handles hidden with `hideHandles()`.


#### `setOpts( object, function )`

Update options and callback.


#### `unplug()`

Removes handles and deletes all values set by the plugin.


#### `updateHandles()`

Updates handles to reflect the element's transformations.


Raphaël.FreeTransform and Raphaël.JSON
--------------------------------------

Instructions on how to use Raphaël.FreeTransform in combination with
Raphaël.JSON can be found 
[here](https://github.com/ElbertF/Raphael.JSON#raphaëljson-and-raphaëlfreetransform).
