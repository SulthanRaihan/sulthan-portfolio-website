# Blender scripts (rebuild the 3D assets)

Run with Blender 5 (installed via `brew install --cask blender`).

**Aiko** — remesh, bake, rig, animate, export (`assets/models/aiko.glb`):

    blender -b -P tools/blender/rig_aiko.py -- /path/to/aiko.glb assets/models/aiko.glb tools/blender/bones.json

- `bones.json`: joint positions as fractions of her height (measured from `preview.py` renders), face count, texture size.
- Clips: idle, walk, wave, sit, sleep, talk, jump, happy.

**Desk props** — plants + stationery merged into one file (`assets/models/desk-props.glb`):

    blender -b -P tools/blender/props.py -- /path/to/extracted/packs assets/models/desk-props.glb

Expects `<packs>/atelier/Atelier_Desk_Props/...` and `<packs>/plants/Tiny_Treats_House_Plants_1.0_FREE/...`.

**Preview** any GLB from the front / side / back:

    blender -b -P tools/blender/preview.py -- model.glb out/prefix

Credits: Tiny Treats House Plants by Isa Lousberg (CC0). ATELIER Desktop Props by yumeno3d — licensed for use inside
finished works only; don't redistribute the pack's files (keep the repository private, or leave `desk-props.glb` out of
a public repo).
