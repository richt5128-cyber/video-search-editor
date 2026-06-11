/**
 * projects.js
 * CRUD helpers for VideoProject + VideoClip entities via Base44 SDK.
 */
import { VideoProject, VideoClip } from '@/api/entities';

/* ── Projects ──────────────────────────────────────────────── */

export async function listProjects() {
  return VideoProject.list({ sort: '-updated_date' });
}

export async function getProject(id) {
  return VideoProject.get(id);
}

export async function createProject({ name, category = 'General', description = '', tags = [], thumbnail = '' }) {
  return VideoProject.create({
    name,
    category,
    description,
    tags,
    thumbnail,
    status: 'draft',
    clips: [],
    timeline: {},
  });
}

export async function updateProject(id, patch) {
  return VideoProject.update(id, patch);
}

export async function deleteProject(id) {
  // Also delete all clips belonging to this project
  const clips = await VideoClip.filter({ project_id: id });
  await Promise.all(clips.map(c => VideoClip.delete(c.id)));
  return VideoProject.delete(id);
}

/* ── Clips ─────────────────────────────────────────────────── */

export async function getClipsForProject(projectId) {
  const clips = await VideoClip.filter({ project_id: projectId });
  return clips.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}

export async function saveClipsForProject(projectId, clips) {
  // 1. Delete existing clips for this project
  const existing = await VideoClip.filter({ project_id: projectId });
  await Promise.all(existing.map(c => VideoClip.delete(c.id)));

  // 2. Re-create from current timeline state
  const created = await Promise.all(
    clips.map((c, i) =>
      VideoClip.create({
        project_id:    projectId,
        title:         c.title,
        url:           c.url,
        thumbnail:     c.thumbnail,
        duration:      c.duration,
        source:        c.source,
        category:      c.category || '',
        tags:          c.tags || [],
        start_trim:    c.start_trim,
        end_trim:      c.end_trim,
        fade_in:       c.fade_in,
        fade_out:      c.fade_out,
        text_overlays: c.text_overlays || [],
        order:         i,
        description:   c.description || '',
      })
    )
  );
  return created;
}

/* ── Save (create-or-update) ───────────────────────────────── */

export async function saveProject({ id, name, category, description, tags, clips, thumbnail }) {
  let project;

  if (id) {
    // Update existing
    project = await updateProject(id, {
      name, category, description, tags,
      thumbnail: thumbnail || clips[0]?.thumbnail || '',
      status: 'editing',
    });
  } else {
    // Create new
    project = await createProject({
      name, category, description, tags,
      thumbnail: thumbnail || clips[0]?.thumbnail || '',
    });
  }

  // Save clips
  await saveClipsForProject(project.id, clips);

  // Store clip count in project record
  await updateProject(project.id, {
    clips: clips.map(c => ({ id: c.id, title: c.title, order: c.order })),
    timeline: { clip_count: clips.length },
  });

  return project;
}

/* ── Load project into editor ──────────────────────────────── */

export async function loadProject(projectId) {
  const [project, clips] = await Promise.all([
    getProject(projectId),
    getClipsForProject(projectId),
  ]);
  return { project, clips };
}
