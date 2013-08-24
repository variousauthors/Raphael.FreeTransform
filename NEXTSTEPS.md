#Next Steps

## Keep Ratio

[ ] Currently keep ration axisNORTH allows the northern handle to be used to
    stretch the figure in both north and south directions. I'd like to be able
    to stretch just north, or to lock north and south, or to lock north and east,
    or to lock all four directions.

## Abstraction

[ ] As it stands we are in much the same situation as before: we are allowed a
    fixed number of handles in fixed positions. I think it would be totally cool
    to have the distance, size, and position of the handles be arbitrary, as well
    as the number of handles.
[ ] All options must be abstracted.
[x] The `handle_blah` options need to be collected together

## Icons

[x] The handles can currently have fill colour and size set on them, but I want
    to be able to specify icons to be used. Not sure whether we would use
    favicons, arbitrary URLs, or a small set of icons...
[x] Allow sizes to be specified per handle
[x] Allow attrs to be specified per handle, with the top level attrs option
    being the default and the rest cascading (so if you set fill and stroke
    on attrs, and only fill on south-attrs, then it will still get the stroke
    you defined).

## Event Listening

[x] The handles should be easily accessible for attaching event listeners.
    perhaps this means adding classes and IDs to the elements being created?
[x] Should add the option "evented" so that we can add handles that neither
    scale nor rotate, but are just there to listen to events.

## Additional Options

[ ] Bounding circle and handle interaction. We want the handles to stay at a
    constant distance from the center, all on the perimeter of a circle. As
    it stands we can only specify a ratio, but that is a problem with long thin
    objects.
[x] We should be able to add custom classes to the handles
[ ] We should be able to customize the handle offset (this is harder)

## Maintenance & Debugging

[ ] I need to do the "Force Numbers" part of each of my new attributes
