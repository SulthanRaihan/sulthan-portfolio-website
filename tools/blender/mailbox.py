# A cream enamel wall mailbox (slot with brass hinges, raised door panel, brass name plate, keyhole) and a sealed
# envelope, modelled from primitives and rendered with Cycles to transparent PNGs for the "Say hi" section.
# blender -b -P tools/blender/mailbox.py -- <out_dir>
import bpy, sys, math, json, os
from mathutils import Vector
from bpy_extras.object_utils import world_to_camera_view

OUT = sys.argv[sys.argv.index("--") + 1]
os.makedirs(OUT, exist_ok=True)
bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene

def mat(name, rgb, rough=0.4, metal=0.0, coat=0.0):
    m = bpy.data.materials.new(name); m.use_nodes = True
    b = m.node_tree.nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value = (*rgb, 1); b.inputs["Roughness"].default_value = rough; b.inputs["Metallic"].default_value = metal
    if "Coat Weight" in b.inputs: b.inputs["Coat Weight"].default_value = coat
    return m
ENAMEL = mat("enamel", (0.74, 0.66, 0.50), 0.36, coat=0.35)
ENAMEL_D = mat("enamel_shade", (0.69, 0.61, 0.46), 0.42, coat=0.2)
BRASS = mat("brass", (0.70, 0.46, 0.15), 0.26, metal=1.0)
DARK = mat("dark", (0.004, 0.0035, 0.003), 1.0)
PAPER = mat("paper", (0.80, 0.74, 0.61), 0.75)
PAPER_D = mat("paper_shade", (0.70, 0.63, 0.49), 0.8)

def box(name, size, loc, material, bevel=0.0, segs=6):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc)
    o = bpy.context.object; o.name = name; o.scale = size
    bpy.ops.object.transform_apply(scale=True)
    if bevel:
        m = o.modifiers.new("bev", "BEVEL"); m.width = bevel; m.segments = segs; m.limit_method = "NONE"
    o.data.materials.append(material)
    bpy.ops.object.shade_smooth()
    return o
def cyl(name, r, depth, loc, material, rot=(math.pi / 2, 0, 0), bevel=0.0, verts=48):
    bpy.ops.mesh.primitive_cylinder_add(radius=r, depth=depth, location=loc, rotation=rot, vertices=verts)
    o = bpy.context.object; o.name = name
    if bevel:
        m = o.modifiers.new("bev", "BEVEL"); m.width = bevel; m.segments = 4; m.limit_method = "ANGLE"
    o.data.materials.append(material); bpy.ops.object.shade_smooth()
    return o

# ---------------------------------------------------------------- the mailbox (front faces -Y; units: metres)
W, H, D = 0.28, 0.34, 0.17
mail = []
mail.append(box("body", (W, D, H), (0, 0, H / 2), ENAMEL, bevel=0.022, segs=10))
# lid: the top part is a separate lip that sits proud of the body by a hair, with a seam under it
mail.append(box("lid", (W + 0.004, D + 0.004, 0.08), (0, 0, H - 0.04), ENAMEL, bevel=0.022, segs=10))
mail.append(box("seam", (W - 0.03, 0.002, 0.003), (0, -D / 2 - 0.002, H - 0.081), DARK))
# slot: a dark mouth across the lid's front, brass hinge blocks at its ends
SLOT_Z = H - 0.045
mail.append(box("slot", (0.19, 0.03, 0.018), (0, -D / 2 + 0.013, SLOT_Z), DARK, bevel=0.006))
mail.append(box("slot_lip", (0.198, 0.004, 0.003), (0, -D / 2 - 0.004, SLOT_Z + 0.011), BRASS, bevel=0.001))
for sx in (-1, 1):
    mail.append(box(f"hinge{sx}", (0.016, 0.012, 0.036), (sx * 0.113, -D / 2 - 0.004, SLOT_Z - 0.002), BRASS, bevel=0.004))
    mail.append(cyl(f"pin{sx}", 0.0045, 0.014, (sx * 0.113, -D / 2 - 0.009, SLOT_Z + 0.008), BRASS))
# door: a raised rounded panel with a shallow recessed field
DOOR_Z = 0.135
mail.append(box("door", (0.226, 0.01, 0.222), (0, -D / 2 - 0.003, DOOR_Z), ENAMEL, bevel=0.016, segs=8))
mail.append(box("door_field", (0.196, 0.006, 0.192), (0, -D / 2 - 0.006, DOOR_Z), ENAMEL_D, bevel=0.012, segs=8))
# name plate with two screws, keyhole escutcheon
PLATE_Z = DOOR_Z + 0.055
mail.append(box("plate", (0.1, 0.006, 0.022), (0, -D / 2 - 0.011, PLATE_Z), BRASS, bevel=0.005))
for sx in (-1, 1): mail.append(cyl(f"screw{sx}", 0.0028, 0.004, (sx * 0.042, -D / 2 - 0.0145, PLATE_Z), BRASS, bevel=0.001))
KEY_Z = DOOR_Z - 0.02
mail.append(cyl("escutcheon", 0.017, 0.006, (0, -D / 2 - 0.011, KEY_Z), BRASS, bevel=0.002))
mail.append(cyl("keyhole", 0.0042, 0.006, (0, -D / 2 - 0.0135, KEY_Z + 0.003), DARK))
mail.append(box("keyslot", (0.0034, 0.006, 0.009), (0, -D / 2 - 0.0135, KEY_Z - 0.003), DARK))

# ---------------------------------------------------------------- the envelope (separate, rendered on its own)
EW, EH = 0.19, 0.13
env = []
env.append(box("env", (EW, 0.003, EH), (0, 0, 0), PAPER, bevel=0.0015, segs=2))
# the flap: a triangle a hair in front, with a soft fold shadow
bpy.ops.mesh.primitive_plane_add(size=1)
flap = bpy.context.object; flap.name = "flap"
me = flap.data; vs = me.vertices
for v, co in zip(vs, [(-EW / 2, 0, EH / 2), (EW / 2, 0, EH / 2), (-EW / 2, 0, EH / 2), (0, 0, -EH * 0.08)]): v.co = Vector(co)
flap.location = (0, -0.0022, 0); flap.data.materials.append(PAPER_D); env.append(flap)
for sx in (-1, 1):                                            # side folds
    bpy.ops.mesh.primitive_plane_add(size=1); f = bpy.context.object
    for v, co in zip(f.data.vertices, [(sx * EW / 2, 0, -EH / 2), (sx * EW / 2, 0, EH / 2), (sx * EW / 2, 0, -EH / 2), (sx * 0.02, 0, -EH * 0.02)]): v.co = Vector(co)
    f.location = (0, -0.0018, 0); f.data.materials.append(PAPER); env.append(f)
env.append(cyl("seal", 0.016, 0.005, (0, -0.005, -EH * 0.06), BRASS, bevel=0.002))
env.append(cyl("seal_rim", 0.019, 0.003, (0, -0.0035, -EH * 0.06), BRASS, bevel=0.0012))
import bmesh
star = bpy.data.meshes.new("star"); bm = bmesh.new(); k = 0.0016; r = 0.009
pts = [(0, r), (k, k), (r, 0), (k, -k), (0, -r), (-k, -k), (-r, 0), (-k, k)]
vs = [bm.verts.new((x, 0, z)) for x, z in pts]; f = bm.faces.new(vs)
ext = bmesh.ops.extrude_face_region(bm, geom=[f]); bmesh.ops.translate(bm, verts=[e for e in ext["geom"] if isinstance(e, bmesh.types.BMVert)], vec=(0, -0.0012, 0))
bm.to_mesh(star); bm.free()
so = bpy.data.objects.new("star", star); so.location = (0, -0.0076, -EH * 0.06); sc.collection.objects.link(so); so.data.materials.append(BRASS); env.append(so)

# ---------------------------------------------------------------- light + camera + render settings
sc.render.engine = "CYCLES"; sc.cycles.samples = 160; sc.cycles.use_denoising = True; sc.cycles.device = "CPU"
sc.render.film_transparent = True; sc.view_settings.view_transform = "AgX"; sc.view_settings.look = "AgX - Base Contrast" if "AgX - Base Contrast" in [l for l in ("AgX - Base Contrast",)] else "None"
sc.world = bpy.data.worlds.new("w"); sc.world.use_nodes = True
sc.world.node_tree.nodes["Background"].inputs["Color"].default_value = (0.95, 0.9, 0.82, 1); sc.world.node_tree.nodes["Background"].inputs["Strength"].default_value = 0.3
sc.view_settings.exposure = -0.35
def area(loc, size, power, color=(1, 0.96, 0.9)):
    l = bpy.data.lights.new("a", "AREA"); l.size = size; l.energy = power; l.color = color
    o = bpy.data.objects.new("a", l); o.location = loc; sc.collection.objects.link(o)
    o.rotation_euler = (Vector((0, 0, 0.17)) - Vector(loc)).to_track_quat("-Z", "Y").to_euler()
area((-0.55, -0.75, 0.75), 0.7, 70)
area((0.7, -0.6, 0.3), 0.6, 25, (0.95, 0.97, 1))
area((0, 0.6, 0.8), 0.6, 30)
cam = bpy.data.objects.new("cam", bpy.data.cameras.new("cam")); sc.collection.objects.link(cam); sc.camera = cam
cam.data.lens = 85

def render(objs, target, size, path, elev=7, margin=1.18):
    for o in bpy.context.scene.objects:
        if o.type == "MESH": o.hide_render = o not in objs
    dist = max(size) * margin / (2 * math.tan(cam.data.angle / 2))
    e = math.radians(elev)
    cam.location = Vector(target) + Vector((0, -math.cos(e), math.sin(e))) * dist
    cam.rotation_euler = (Vector(target) - cam.location).to_track_quat("-Z", "Y").to_euler()
    sc.render.filepath = path; bpy.ops.render.render(write_still=True)

sc.render.resolution_x, sc.render.resolution_y = 1000, 1200
render(mail, (0, 0, H / 2 + 0.005), (W, H * 1.05), f"{OUT}/mailbox.png")
# where the slot's top edge lands in the picture (0..1 from the top), so the page can line the letter up with it
cv = world_to_camera_view(sc, cam, Vector((0, -D / 2, SLOT_Z + 0.009)))
lid = world_to_camera_view(sc, cam, Vector((0, -D / 2, H)))
info = {"slot_y": round(1 - cv.y, 4), "slot_x0": round(world_to_camera_view(sc, cam, Vector((-0.095, -D / 2, SLOT_Z))).x, 4),
        "slot_x1": round(world_to_camera_view(sc, cam, Vector((0.095, -D / 2, SLOT_Z))).x, 4), "top_y": round(1 - lid.y, 4)}
sc.render.resolution_x, sc.render.resolution_y = 900, 640
render(env, (0, 0, 0), (EW, EH), f"{OUT}/envelope.png", elev=0, margin=1.06)
json.dump(info, open(f"{OUT}/mailbox.json", "w")); print("SLOT", info)
