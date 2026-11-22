# Aiko: clean up the single-pose AI mesh, give it a skeleton, skin it and animate it, then export a web-sized GLB.
# blender -b -P rig_aiko.py -- <in.glb> <out.glb> <bones.json>
# bones.json: joint positions as fractions of the height (x: right +, y: back +, z: up), measured from the previews.
import bpy, bmesh, sys, json, math, mathutils
from mathutils import Vector, Quaternion

argv = sys.argv[sys.argv.index("--") + 1:]
SRC, OUT, JOINTS = argv[0], argv[1], json.load(open(argv[2]))
TARGET_FACES = int(JOINTS.get("faces", 60000))
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=SRC)
body = [o for o in bpy.context.scene.objects if o.type == "MESH"][0]
for o in list(bpy.context.scene.objects):
    if o is not body and o.type != "MESH": pass
bpy.context.view_layer.objects.active = body; body.select_set(True)
bpy.ops.object.parent_clear(type="CLEAR_KEEP_TRANSFORM")
bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)

# ---------------------------------------------------------------- normalise: 1 unit tall, feet at 0, centred, facing -Y
me = body.data
co = [v.co.copy() for v in me.vertices]
mn = Vector((min(c.x for c in co), min(c.y for c in co), min(c.z for c in co)))
mx = Vector((max(c.x for c in co), max(c.y for c in co), max(c.z for c in co)))
H = mx.z - mn.z
off = Vector(((mn.x + mx.x) / 2, (mn.y + mx.y) / 2, mn.z))
if JOINTS.get("turn", 0):                                    # if the model faces another way
    body.rotation_euler.z = math.radians(JOINTS["turn"]); bpy.ops.object.transform_apply(rotation=True)
for v in me.vertices: v.co = (v.co - off) / H
me.update()
print("NORMALISED from height", round(H, 4))

# ---------------------------------------------------------------- lighter mesh + baked texture
# Collapsing the textured mesh smears its UV seams (hair texture lands on the face), so: decimate a copy, give it
# fresh UVs, and bake the original's colour onto it.
high = body
low = high.copy(); low.data = high.data.copy(); low.name = "Aiko"; bpy.context.scene.collection.objects.link(low)
bpy.ops.object.select_all(action="DESELECT"); low.select_set(True); bpy.context.view_layer.objects.active = low
# AI meshes have inner layers (a shell inside the face, hair inside the head); decimated, they poke through the skin.
# A voxel remesh wraps the model in one clean outer shell first; the colour is baked from the original afterwards.
rem = low.modifiers.new("rem", "REMESH"); rem.mode = "VOXEL"; rem.voxel_size = float(JOINTS.get("voxel", 0.0035)); rem.adaptivity = 0
bpy.ops.object.modifier_apply(modifier=rem.name)
print("REMESHED faces", len(low.data.polygons))
dec = low.modifiers.new("dec", "DECIMATE"); dec.decimate_type = "COLLAPSE"
dec.ratio = min(1.0, TARGET_FACES / max(1, len(low.data.polygons)))
bpy.ops.object.modifier_apply(modifier=dec.name)
bm = bmesh.new(); bm.from_mesh(low.data)
# the sculpt stands on a thin display base: she walks on the desk itself, so the base goes
bmesh.ops.delete(bm, geom=[v for v in bm.verts if v.co.z < float(JOINTS.get("base_cut", 0.014))], context="VERTS")
bmesh.ops.recalc_face_normals(bm, faces=bm.faces); bm.to_mesh(low.data); bm.free()
while low.data.uv_layers: low.data.uv_layers.remove(low.data.uv_layers[0])
low.data.uv_layers.new(name="UVMap")
for p_ in low.data.polygons: p_.use_smooth = True
# two materials, each with its own texture: the head gets a whole texture to itself (sharp eyes), the body another
HEAD_Z = float(JOINTS.get("head_from", 0.56))
TEX = int(JOINTS.get("tex", 2048))
low.data.materials.clear()
mats = []
for part in ("head", "body"):
    img = bpy.data.images.new(f"aiko_{part}", TEX, TEX, alpha=True); img.generated_color = (0, 0, 0, 0)
    mat = bpy.data.materials.new(f"Aiko_{part}"); mat.use_nodes = True
    nt = mat.node_tree; bsdf = nt.nodes["Principled BSDF"]; bsdf.inputs["Roughness"].default_value = 0.6
    tn = nt.nodes.new("ShaderNodeTexImage"); tn.image = img; nt.links.new(tn.outputs["Color"], bsdf.inputs["Base Color"]); nt.nodes.active = tn
    low.data.materials.append(mat); mats.append(img)
for p_ in low.data.polygons:
    p_.material_index = 0 if min(low.data.vertices[i].co.z for i in p_.vertices) > HEAD_Z else 1
for idx in (0, 1):                                            # each part fills its own UV square
    bpy.ops.object.mode_set(mode="EDIT"); bpy.ops.mesh.select_all(action="DESELECT")
    low.active_material_index = idx; bpy.ops.object.material_slot_select()
    bpy.ops.uv.smart_project(angle_limit=math.radians(80), island_margin=0.002)
    bpy.ops.object.mode_set(mode="OBJECT")
sc = bpy.context.scene; sc.render.engine = "CYCLES"; sc.cycles.samples = 1; sc.cycles.device = "CPU"
sc.render.bake.use_selected_to_active = True; sc.render.bake.cage_extrusion = 0.035; sc.render.bake.max_ray_distance = 0.12; sc.render.bake.margin = 4
high.select_set(True); low.select_set(True); bpy.context.view_layer.objects.active = low
bpy.ops.object.bake(type="DIFFUSE", pass_filter={"COLOR"})
# fill every pixel the bake did not reach with its nearest baked neighbours (no black between UV islands,
# which mipmapping in the browser would otherwise smear into the texture as dark speckles)
import numpy as np
for im in mats:
    w, h = im.size; px = np.empty(w * h * 4, dtype=np.float32); im.pixels.foreach_get(px); px = px.reshape(h, w, 4)
    rgb, a = px[..., :3] * (px[..., 3:4] > 0), (px[..., 3] > 0).astype(np.float32)
    for _ in range(256):
        if a.min() > 0: break
        s_rgb = np.zeros_like(rgb); s_a = np.zeros_like(a)
        for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            s_rgb += np.roll(np.roll(rgb * a[..., None], dy, 0), dx, 1); s_a += np.roll(np.roll(a, dy, 0), dx, 1)
        grow = (a == 0) & (s_a > 0)
        rgb[grow] = s_rgb[grow] / s_a[grow][:, None]; a[grow] = 1
    px[..., :3] = rgb; px[..., 3] = 1
    im.pixels.foreach_set(px.ravel()); im.update(); im.pack()
bpy.data.objects.remove(high)
body = low; me = body.data
print("FACES", len(me.polygons), "VERTS", len(me.vertices), "baked", TEX)

# ---------------------------------------------------------------- skeleton
J = {k: Vector(v) for k, v in JOINTS["joints"].items()}
def leg_centres(z0, band=0.006):
    pts = [v.co.copy() for v in me.vertices if abs(v.co.z - z0) < band]
    xs = sorted(p.x for p in pts)
    gap, i = max((xs[k + 1] - xs[k], k) for k in range(len(xs) - 1))
    split = (xs[i] + xs[i + 1]) / 2
    side_pts = ([p for p in pts if p.x > split], [p for p in pts if p.x < split])
    cen = [Vector((sum(p.x for p in P) / len(P), sum(p.y for p in P) / len(P), z0)) for P in side_pts]
    return cen[0], cen[1], gap                                  # +x side, -x side
LPXS = "L" if JOINTS["left_is_plus_x"] else "R"; LMXS = "R" if LPXS == "L" else "L"
for zname, z0 in (("knee", 0.24), ("foot", 0.17), ("hip", 0.27)):
    a_, b_, gap = leg_centres(z0)
    print("LEGS at", z0, "gap", round(gap, 4), tuple(round(c, 3) for c in a_), tuple(round(c, 3) for c in b_))
    if gap > 0.01:
        J[f"{zname}.{LPXS}"] = Vector((a_.x, a_.y, J[f"{zname}.{LPXS}"].z)); J[f"{zname}.{LMXS}"] = Vector((b_.x, b_.y, J[f"{zname}.{LMXS}"].z))
for sd in ("L", "R"):                                   # hips straight above the measured knees
    J[f"hip.{sd}"] = Vector((J[f"knee.{sd}"].x, J[f"knee.{sd}"].y + 0.01, J[f"hip.{sd}"].z))
CX = (J["hip.L"].x + J["hip.R"].x) / 2
J["hips"].x = J["spine"].x = J["chest"].x = J["neck"].x = J["head_top"].x = CX
arm_data = bpy.data.armatures.new("AikoRig"); rig = bpy.data.objects.new("AikoRig", arm_data)
bpy.context.scene.collection.objects.link(rig)
bpy.context.view_layer.objects.active = rig; bpy.ops.object.mode_set(mode="EDIT")
eb = arm_data.edit_bones
def bone(name, head, tail, parent=None, connect=False):
    b = eb.new(name); b.head = J[head] if isinstance(head, str) else head; b.tail = J[tail] if isinstance(tail, str) else tail
    if parent: b.parent = eb[parent]; b.use_connect = connect
    b.roll = 0; return b
bone("root", Vector((0, 0, 0)), Vector((0, 0, 0.1)))
bone("hips", "hips", "spine", "root")
bone("spine", "spine", "chest", "hips", True)
bone("chest", "chest", "neck", "spine", True)
bone("head", "neck", "head_top", "chest", True)
if "hair" in J: bone("hair", "hair", "hair_tip", "head")
for s in ("L", "R"):
    bone(f"upper_arm.{s}", f"shoulder.{s}", f"elbow.{s}", "chest")
    bone(f"forearm.{s}", f"elbow.{s}", f"hand.{s}", f"upper_arm.{s}", True)
    bone(f"thigh.{s}", f"hip.{s}", f"knee.{s}", "hips")
    bone(f"shin.{s}", f"knee.{s}", f"foot.{s}", f"thigh.{s}", True)
bpy.ops.object.mode_set(mode="OBJECT")

# skin: geodesic weights. Distances are measured along the surface from each bone's core, so a hand resting on the
# skirt (or hair falling over an arm) does not drag the other part along.
import heapq
body.select_set(True); rig.select_set(True); bpy.context.view_layer.objects.active = rig
bpy.ops.object.parent_set(type="ARMATURE_NAME")
segs = {b.name: (b.head_local.copy(), b.tail_local.copy()) for b in arm_data.bones if b.name != "root"}
RAD = {"head": 0.2, "chest": 0.09, "spine": 0.09, "hips": 0.1, "hair": 0.07}
def dseg(p, a, b):
    ab = b - a; t = max(0, min(1, (p - a).dot(ab) / max(1e-9, ab.length_squared))); return (p - (a + ab * t)).length
side = lambda n: 1 if n.endswith(".L") else -1 if n.endswith(".R") else 0
LPX = 1 if JOINTS["left_is_plus_x"] else -1
verts = [v.co.copy() for v in me.vertices]; N = len(verts)
adj = [[] for _ in range(N)]
for e in me.edges:
    i, j = e.vertices; d = (verts[i] - verts[j]).length; adj[i].append((j, d)); adj[j].append((i, d))
G = {}
for n, (a, b) in segs.items():
    r = RAD.get(n, 0.045)
    ds = [dseg(p, a, b) for p in verts]
    seeds = [i for i in range(N) if ds[i] < r and (not side(n) or verts[i].x * LPX * side(n) > -0.005)]
    if len(seeds) < 10: seeds = sorted(range(N), key=lambda i: ds[i])[:30]
    dist = [1e9] * N; hq = []
    for i in seeds: dist[i] = ds[i]; hq.append((ds[i], i))
    heapq.heapify(hq)
    while hq:
        d, i = heapq.heappop(hq)
        if d > dist[i] or d > 0.6: continue
        for j, w in adj[i]:
            nd = d + w
            if nd < dist[j]: dist[j] = nd; heapq.heappush(hq, (nd, j))
    G[n] = dist
for g in list(body.vertex_groups): body.vertex_groups.remove(g)
vg = {n: body.vertex_groups.new(name=n) for n in segs}
# limbs: a vertex follows an arm/leg bone only inside a cylinder around it (and not past its end), so a jacket hem
# that touches the hand stays with the body. Everything else shares the core bones by geodesic distance.
LIMB_R = {"upper_arm": (0.03, 0.055), "forearm": (0.026, 0.05), "thigh": (0.05, 0.1), "shin": (0.07, 0.1)}
MIN_ABS_X = {"upper_arm": 0.065, "forearm": 0.115}   # how far from the body centre an arm vertex must be
def seg_t(p, a, b):
    ab = b - a; return (p - a).dot(ab) / max(1e-9, ab.length_squared)
def smooth(e0, e1, x):
    t = max(0.0, min(1.0, (x - e0) / (e1 - e0))); return t * t * (3 - 2 * t)
import numpy as np
BN = list(segs); BI = {n: k for k, n in enumerate(BN)}; W = np.zeros((N, len(BN)), dtype=np.float64)
limbs = [n for n in segs if n.split(".")[0] in LIMB_R]
core = [n for n in segs if n not in limbs]
for i in range(N):
    p = verts[i]; lw = []
    for n in limbs:
        sd = side(n)
        if p.x * LPX * sd < 0.01: continue
        a, b = segs[n]; t = seg_t(p, a, b)
        kind = n.split(".")[0]
        if abs(p.x - CX) < MIN_ABS_X.get(kind, 0): continue
        if t < (-0.7 if kind == "thigh" else -0.2) or t > (2.3 if kind == "shin" else 1.12): continue   # the shin carries the whole shoe
        r_in, r_out = LIMB_R[n.split(".")[0]]
        w = 1 - smooth(r_in, r_out, dseg(p, a, b))
        if w > 0: lw.append((w, n))
    lw.sort(reverse=True); lw = lw[:2]
    L = min(1.0, sum(w for w, _ in lw))
    if p.z < 0.2:                                            # below the skirt everything belongs to the leg on its side
        sd = "L" if (p.x - CX) * LPX > 0 else "R"
        dl = [(1.0 / (dseg(p, *segs[f"{k}.{sd}"]) ** 4 + 1e-8), f"{k}.{sd}") for k in ("shin", "thigh")]
        lw = sorted(dl, reverse=True); L = 1.0
    cw = sorted(((1.0 / (G[n][i] ** 4 + 1e-8), n) for n in core if G[n][i] < 1e8), reverse=True)[:2]
    if not cw: cw = [(1.0, min(core, key=lambda n: dseg(p, *segs[n])))]
    ct = sum(w for w, _ in cw); lt = sum(w for w, _ in lw) or 1
    for w, n in lw: W[i, BI[n]] += L * w / lt
    for w, n in cw: W[i, BI[n]] += (1 - L) * w / ct
# smooth the weights over the surface (no lone vertices pulled into spikes), keep the 4 strongest, normalise
E = np.array([e.vertices[:] for e in me.edges], dtype=np.int64)
deg = np.zeros(N); np.add.at(deg, E[:, 0], 1); np.add.at(deg, E[:, 1], 1); deg = np.maximum(deg, 1)[:, None]
for _ in range(int(JOINTS.get("smooth", 6))):
    acc = np.zeros_like(W); np.add.at(acc, E[:, 0], W[E[:, 1]]); np.add.at(acc, E[:, 1], W[E[:, 0]])
    W = 0.5 * W + 0.5 * acc / deg
order = np.argsort(-W, axis=1)
keep = np.zeros_like(W, dtype=bool); np.put_along_axis(keep, order[:, :4], True, axis=1)
W = np.where(keep, W, 0); W /= np.maximum(W.sum(1, keepdims=True), 1e-9)
for k, n in enumerate(BN):
    idx = np.nonzero(W[:, k] > 1e-4)[0]
    for i in idx: vg[n].add([int(i)], float(W[i, k]), "REPLACE")
print("GEODESIC WEIGHTS applied + smoothed")

# ---------------------------------------------------------------- animation: rotations about armature-space axes
pb = rig.pose.bones
for b in pb: b.rotation_mode = "QUATERNION"
def q(bname, axis, deg):
    """rotation about an armature-space axis through the bone's head, in the bone's own space"""
    R = arm_data.bones[bname].matrix_local.to_quaternion()
    return R.inverted() @ Quaternion(Vector(axis), math.radians(deg)) @ R
X, Y, Z = (1, 0, 0), (0, 1, 0), (0, 0, 1)
def key(action, frame, poses, loc=None):
    for name, parts in poses.items():
        r = Quaternion()
        for axis, deg in parts: r = q(name, axis, deg) @ r
        pb[name].rotation_quaternion = r; pb[name].keyframe_insert("rotation_quaternion", frame=frame, group=name)
    if loc is not None:
        pb["hips"].location = Vector(loc); pb["hips"].keyframe_insert("location", frame=frame, group="hips")
def action(name, frames, loop=True):
    rig.animation_data_create(); a = bpy.data.actions.new(name); rig.animation_data.action = a
    for b in pb: b.rotation_quaternion = Quaternion(); b.location = Vector()
    frames(a)
    trk = rig.animation_data.nla_tracks.new(); trk.name = name
    st = trk.strips.new(name, int(a.frame_range[0]), a); st.name = name
    rig.animation_data.action = None
    return a
FPS = 30
bpy.context.scene.render.fps = FPS
# directions (armature space, the character faces -Y, her left is +X):
#   a hanging limb rotated +X swings BACK, -X swings FORWARD; an upright bone rotated +X leans FORWARD
#   an arm raised sideways: left arm -Y, right arm +Y (see arms())
def arms(out=0, swing=0, out_r=None):
    o_r = out if out_r is None else out_r
    return {"upper_arm.L": [(Y, -out), (X, swing)], "upper_arm.R": [(Y, o_r), (X, -swing)]}
def hips_at(z=0.0, y=0.0):                               # hips bone points up: local (x, y, z) = world (x, z, -y)
    return (0, z, -y)

def idle(a):
    for f, b in ((0, 0), (30, 1), (60, 0)):
        p = arms(out=3 * b)
        p.update({"chest": [(X, -2 * b)], "head": [(Y, 3 - 6 * b), (X, -2 * b)]})
        if "hair" in J: p["hair"] = [(X, 3 * b)]
        key(a, f, p, loc=hips_at(0.004 * b))
action("idle", idle)

def walk(a):
    for i, f in enumerate((0, 6, 12, 18, 24)):
        s, c = math.sin(i / 4 * 2 * math.pi), math.cos(i / 4 * 2 * math.pi)
        p = arms(out=3, swing=9 * s)
        p.update({"thigh.L": [(X, -30 * s)], "thigh.R": [(X, 30 * s)],
                  "shin.L": [(X, 14 * max(0, s))], "shin.R": [(X, 14 * max(0, -s))],
                  "chest": [(Z, 5 * s), (X, 3)], "head": [(Z, -4 * s)]})
        if "hair" in J: p["hair"] = [(X, 8 + 3 * abs(s))]
        key(a, f, p, loc=hips_at(0.016 * abs(c)))
action("walk", walk)

def wave(a):
    for f, k, w in ((0, 0, 0), (8, 1, 1), (14, 1, -1), (20, 1, 1), (26, 1, -1), (32, 1, 1), (40, 0, 0)):
        p = arms(out=3, out_r=3 + 36 * k)
        p["forearm.R"] = [(Y, (42 + 16 * w) * k)]
        p["chest"] = [(Z, -5 * k), (Y, 3 * k)]
        p["head"] = [(Y, -7 * k), (X, -3 * k)]
        key(a, f, p)
action("wave", wave)

def sit(a):
    for f, b in ((0, 0), (40, 1), (80, 0)):
        p = arms(out=5)
        p.update({"thigh.L": [(X, -82)], "thigh.R": [(X, -82)], "shin.L": [(X, 6 + 10 * b)], "shin.R": [(X, 6 + 10 * (1 - b))],
                  "chest": [(X, -3)], "head": [(Y, 5 - 10 * b)]})
        key(a, f, p, loc=hips_at(-JOINTS["sit_drop"]))
action("sit", sit)

def sleep(a):
    for f, b in ((0, 0), (45, 1), (90, 0)):
        p = arms(out=5)
        p.update({"thigh.L": [(X, -82)], "thigh.R": [(X, -82)], "shin.L": [(X, 4)], "shin.R": [(X, 4)],
                  "chest": [(X, 10 + 2 * b)], "head": [(X, 22 + 3 * b), (Y, 14)]})
        if "hair" in J: p["hair"] = [(X, -4)]
        key(a, f, p, loc=hips_at(-JOINTS["sit_drop"]))
action("sleep", sleep)

def talk(a):
    for f, b in ((0, 0), (8, 1), (16, 0), (24, 1), (32, 0)):
        p = arms(out=4)
        p.update({"head": [(X, 5 * b), (Y, 3 * b)], "chest": [(Z, 3 * b)], "upper_arm.L": [(Y, -4 - 8 * b), (X, -10 * b)], "forearm.L": [(X, -16 * b)]})
        key(a, f, p)
action("talk", talk)

def jump(a):
    for f, crouch, up, raise_ in ((0, 0, 0, 0), (6, 1, 0, 0.2), (14, 0, 0.12, 1), (22, 0.4, 0.02, 0.5), (28, 0, 0, 0)):
        p = arms(out=3 + 28 * raise_)
        p.update({"thigh.L": [(X, -35 * crouch)], "thigh.R": [(X, -35 * crouch)], "shin.L": [(X, 60 * crouch)], "shin.R": [(X, 60 * crouch)], "chest": [(X, 10 * crouch)]})
        key(a, f, p, loc=hips_at(up - 0.045 * crouch))
action("jump", jump, loop=False)

def happy(a):
    for f, b in ((0, 0), (7, 1), (14, 0), (21, 1), (28, 0)):
        p = arms(out=18 + 8 * b)
        p.update({"forearm.L": [(Y, -14 * b)], "forearm.R": [(Y, 14 * b)], "head": [(Y, 8 * b - 4)], "chest": [(Y, 5 * b - 2.5)]})
        key(a, f, p, loc=hips_at(0.03 * b))
action("happy", happy)

# ---------------------------------------------------------------- export
for b in pb: b.rotation_quaternion = Quaternion(); b.location = Vector()
bpy.ops.object.select_all(action="DESELECT"); body.select_set(True); rig.select_set(True)
bpy.ops.export_scene.gltf(filepath=OUT, export_format="GLB", use_selection=True, export_animations=True,
                          export_animation_mode="NLA_TRACKS", export_skins=True, export_image_format="WEBP", export_image_quality=88,
                          export_draco_mesh_compression_enable=False,
                          export_apply=False, export_yup=True)
print("EXPORTED", OUT)
