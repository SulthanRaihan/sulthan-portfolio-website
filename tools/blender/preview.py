# Renders front / side / back previews of a GLB (textured, workbench) so the pose can be checked before rigging.
# blender -b -P preview.py -- <in.glb> <out_prefix>
import bpy, sys, math, mathutils
argv = sys.argv[sys.argv.index("--") + 1:]
src, out = argv[0], argv[1]
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=src)
meshes = [o for o in bpy.context.scene.objects if o.type == "MESH"]
mn = mathutils.Vector((1e9,) * 3); mx = -mn
for o in meshes:
    for c in o.bound_box:
        w = o.matrix_world @ mathutils.Vector(c); mn = mathutils.Vector(map(min, mn, w)); mx = mathutils.Vector(map(max, mx, w))
ctr, size = (mn + mx) / 2, max(mx - mn)
print("BOUNDS", tuple(round(v, 4) for v in mn), tuple(round(v, 4) for v in mx), "verts", sum(len(o.data.vertices) for o in meshes))
sc = bpy.context.scene
sc.render.engine = "BLENDER_WORKBENCH"
sc.display.shading.light = "FLAT"; sc.display.shading.color_type = "TEXTURE"
sc.render.resolution_x = sc.render.resolution_y = 700
sc.world = bpy.data.worlds.new("w"); sc.world.color = (0.18, 0.2, 0.26)
cam = bpy.data.objects.new("cam", bpy.data.cameras.new("cam")); sc.collection.objects.link(cam); sc.camera = cam
cam.data.type = "ORTHO"; cam.data.ortho_scale = size * 1.1
for name, ang in (("front", 0), ("side", 90), ("back", 180), ("q", 35)):
    a = math.radians(ang)
    cam.location = ctr + mathutils.Vector((math.sin(a), -math.cos(a), 0)) * size * 3   # Blender: -Y is the front
    cam.rotation_euler = (math.radians(90), 0, a)
    sc.render.filepath = f"{out}_{name}.png"
    bpy.ops.render.render(write_still=True)
