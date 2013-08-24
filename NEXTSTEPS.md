#Next Steps

## Keep Ratio

[ ] Currently keep ration axisNORTH allows the northern handle to be used to stretch
    the figure in both north and south directions. I'd like to be able to stretch
    just north, or to lock north and south, or to lock north and east, or to lock
    all four directions.
[ ] All options must be abstracted.

## Abstraction

[ ] As it stands we are in much the same situation as before: we are allowed a fixed
    number of handles in fixed positions. I think it would be totally cool to have the
    distance, size, and position of the handles be arbitrary, as well as the number of
    handles.

## Icons

[x] The handles can currently have fill colour and size set on them, but I want to be
    able to specify icons to be used. Not sure whether we would use favicons, arbitrary
    URLs, or a small set of icons...
[ ] Allow sizes to be specified per handle

## Event Listening

[ ] The handles should be easily accessible for attaching event listeners.
    perhaps this means adding classes and IDs to the elements being created?
[ ] Should add the option "evented" so that we can add handles that neither
    scale nor rotate, but are just there to listen to events.
