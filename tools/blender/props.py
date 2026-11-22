# Desk dressing: picks props from the two packs, sizes them to the scene's desk (the room is ~3.1× real size),
# places them in scene coordinates and exports ONE combined GLB (props embedded in the scene, not as separate assets).
# blender -b -P props.py -- <packs_dir> <out.glb> [name_prefix]
# The public site uses: … assets/models/desk-plants.glb plant_   (CC0 plants only; the ATELIER pack may not be redistributed)
import bpy, sys, math, os
from mathutils import Vector
argv = sys.argv[sys.argv.index("--") + 1:]
PACKS, OUT = argv[0], argv[1]
ONLY = argv[2] if len(argv) > 2 else ""                      # e.g. "plant_" → export only the CC0 plants (desk-plants.glb)
AT = os.path.join(PACKS, "atelier/Atelier_Desk_Props/Individual_GLB")
PL = os.path.join(PACKS, "plants/Tiny_Treats_House_Plants_1.0_FREE/Assets/gltf")
REAL = 3.1                                                   # metres → scene units
# name, file, three.js (x, z), rotation (deg), size: ("scale", k) or ("height", h), y (base height in three.js units)
PROPS = [
    ("plant_monstera", f"{PL}/monstera_plant_medium_potted.gltf", (-1.95, -0.3), 20, ("height", 1.0), 0),
    ("plant_cactus", f"{PL}/cacti_plant_pot_small.gltf", (1.62, 0.22), -30, ("height", 0.4), 0),
    ("plant_pothos", f"{PL}/pothos_plant_small_potted.gltf", (-0.42, -0.28), 0, ("height", 0.36), 1.45),
    ("pencil_cup", f"{AT}/01_Ceramic_pencil_cup.glb", (-1.15, 1.0), 0, ("scale", REAL), 0),
    ("pencils", f"{AT}/02_Cedar_pencils.glb", (-1.15, 1.0), 25, ("scale", REAL), 0.03),
    ("notebook", f"{AT}/03_A6_spiral_notebook.glb", (-0.75, 1.95), 18, ("scale", REAL), 0),
    ("pen", f"{PACKS}/atelier/Atelier_Desk_Props/Optional_Compact_Extras/10_Pen_Optimized.glb", (-0.7, 1.95), 60, ("scale", REAL), "on:notebook"),
    ("stapler", f"{AT}/04_Compact_stapler.glb", (-1.62, 1.05), 50, ("scale", REAL), 0),
    ("tape", f"{AT}/05_Desktop_tape_dispenser.glb", (1.5, 1.25), -35, ("scale", REAL), 0),
    ("memo", f"{AT}/06_Memo_pad.glb", (-1.5, 1.6), 12, ("scale", REAL), 0),
    ("clips", f"{AT}/08_Brass_paper_clips.glb", (0.32, 1.8), 20, ("scale", REAL), 0),
    ("ruler", f"{PACKS}/atelier/Atelier_Desk_Props/Optional_Compact_Extras/09_Ruler_Optimized.glb", (0.2, 2.0), -4, ("scale", REAL), 0),
]
if ONLY: PROPS = [p for p in PROPS if p[0].startswith(ONLY)]
bpy.ops.wm.read_factory_settings(use_empty=True)
tops = {}
for name, path, (x, z), rot, (mode, k), base in PROPS:
    before = set(bpy.context.scene.objects)
    if path.endswith(".gltf") or path.endswith(".glb"): bpy.ops.import_scene.gltf(filepath=path)
    new = [o for o in bpy.context.scene.objects if o not in before]
    meshes = [o for o in new if o.type == "MESH"]
    for o in new: o.select_set(o in meshes)
    bpy.context.view_layer.objects.active = meshes[0]
    for o in meshes:                                         # keep world transforms, drop the empties
        mw = o.matrix_world.copy(); o.parent = None; o.matrix_world = mw
    for o in new:
        if o.type != "MESH": bpy.data.objects.remove(o)
    bpy.ops.object.select_all(action="DESELECT")
    for o in meshes: o.select_set(True)
    bpy.context.view_layer.objects.active = meshes[0]
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    if len(meshes) > 1: bpy.ops.object.join()
    ob = bpy.context.view_layer.objects.active; ob.name = name
    pts = [ob.matrix_world @ Vector(c) for c in ob.bound_box]
    mn = Vector((min(p.x for p in pts), min(p.y for p in pts), min(p.z for p in pts))); mx = Vector((max(p.x for p in pts), max(p.y for p in pts), max(p.z for p in pts)))
    s = k if mode == "scale" else k / max(1e-6, mx.z - mn.z)
    for v in ob.data.vertices:                               # base centred at the origin, then sized
        v.co = (v.co - Vector(((mn.x + mx.x) / 2, (mn.y + mx.y) / 2, mn.z))) * s
    y = tops[base[3:]] if isinstance(base, str) else base
    ob.location = Vector((x, -z, y))                         # three.js (x, y, z) → Blender (x, -z, y)
    ob.rotation_euler.z = math.radians(rot)
    tops[name] = y + (mx.z - mn.z) * s
    print("PROP", name, "size", tuple(round((mx[i] - mn[i]) * s, 3) for i in range(3)))
bpy.ops.object.select_all(action="SELECT")
bpy.ops.export_scene.gltf(filepath=OUT, export_format="GLB", use_selection=True, export_image_format="WEBP", export_yup=True, export_apply=True)
print("EXPORTED", OUT, os.path.getsize(OUT))
