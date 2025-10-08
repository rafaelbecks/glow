# Zen of G.L.O.W.

*The guiding principles that shape G.L.O.W.'s design and development*

## Core Principles

**Simplicity over complexity**  
Simple and minimal is better than complex and overloaded. Every feature should serve a clear purpose.

**Spatial context in 2D**  
We use the 2D canvas context. Any illusion of 3D movement is achieved through geometric projection (see `UTILS.rotate3D()` in settings.js for rotation helpers).

**Human input as first-class citizen**  
Every luminode should be drawn or affected by human motion - whether from MIDI controllers, digital pens, or other input devices.

**Modular architecture**  
Everything added should be modular. Components should be independent and composable.

**Vanilla JavaScript preferred**  
Vanilla JS is better than bloated libraries. Use a library only if it's actually needed - vanilla JS can provide most functionality.

**Geometric purity**  
Draw inspiration from mathematical and artistic principles. Every visual should have geometric or mathematical foundation.

**Open and extensible**  
The architecture should welcome new luminodes and features without breaking existing functionality.

**Artistic integrity**  
Honor the pioneers of geometric and kinetic art. Every pattern should have artistic or mathematical significance.

---

*These principles guide every decision in G.L.O.W.'s development, from architecture choices to visual design.*
