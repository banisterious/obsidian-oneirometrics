/**
 * Default Dream Taxonomy
 * 
 * The default hierarchical classification system for dream themes.
 * Based on common dream research patterns and psychological frameworks.
 */

import { DreamTaxonomy, TaxonomyCluster, TaxonomyVector, TaxonomyTheme } from '../types/taxonomy';

/**
 * Generate unique IDs for taxonomy elements
 */
function generateId(prefix: string, name: string): string {
    return `${prefix}_${name.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
}

/**
 * Create a theme object
 */
function createTheme(name: string, vectorId: string, description?: string): TaxonomyTheme {
    return {
        id: generateId('theme', name),
        name,
        vectorIds: [vectorId],
        description,
        usageCount: 0
    };
}

/**
 * Create a vector object with themes
 */
function createVector(
    name: string, 
    clusterId: string, 
    themeData: Array<{ name: string; description?: string }>,
    icon?: string
): TaxonomyVector {
    const vectorId = generateId('vector', name);
    return {
        id: vectorId,
        name,
        parentClusterId: clusterId,
        icon,
        themes: themeData.map(t => createTheme(t.name, vectorId, t.description))
    };
}

/**
 * Get the default dream taxonomy
 */
export function getDefaultTaxonomy(): DreamTaxonomy {
    const clusters: TaxonomyCluster[] = [
        // Cluster 1: Action & Agency
        {
            id: 'cluster_action_agency',
            name: 'Action & Agency',
            color: '#e74c3c',
            description: 'Dreams involving purposeful actions, missions, and the exercise of personal agency',
            vectors: [
                createVector('Mission & Strategy', 'cluster_action_agency', [
                    { name: 'Ambition', description: 'Dreams of achieving goals, reaching heights, accomplishing great feats' },
                    { name: 'Challenge', description: 'Facing tests, competitions, obstacles to overcome' },
                    { name: 'Choice', description: 'Standing at crossroads, making important decisions, selecting paths' },
                    { name: 'Coordination', description: 'Organizing groups, synchronizing efforts, teamwork scenarios' },
                    { name: 'Intervention', description: 'Stepping in to help, preventing disasters, changing outcomes' },
                    { name: 'Leadership', description: 'Leading others, taking charge, guiding groups' },
                    { name: 'Mission', description: 'Having a specific quest, important task, or purpose to fulfill' },
                    { name: 'Outreach', description: 'Helping others, extending assistance, making connections' },
                    { name: 'Responsibility', description: 'Being accountable, carrying burdens, fulfilling duties' },
                    { name: 'Strategy', description: 'Planning approaches, solving complex problems, tactical thinking' }
                ], 'target'),
                createVector('Pursuit & Consequence', 'cluster_action_agency', [
                    { name: 'Acquisition', description: 'Gathering resources, collecting items, obtaining necessities' },
                    { name: 'Escape', description: 'Breaking free, leaving danger, finding exits' },
                    { name: 'Evasion', description: 'Dodging threats, avoiding capture, staying hidden' },
                    { name: 'Maneuver', description: 'Navigating obstacles, strategic movement, skillful navigation' },
                    { name: 'Pursuit', description: 'Being chased, hunting something, following targets' },
                    { name: 'Traversal', description: 'Crossing territories, moving through spaces, journeying' },
                    { name: 'Urgency', description: 'Racing against time, emergency situations, critical deadlines' }
                ], 'zap')
            ]
        },

        // Cluster 2: Boundaries & Barriers
        {
            id: 'cluster_boundaries_barriers',
            name: 'Boundaries & Barriers',
            color: '#3498db',
            description: 'Dreams featuring physical or metaphorical boundaries, confinement, and structural collapse',
            vectors: [
                createVector('Confinement', 'cluster_boundaries_barriers', [
                    { name: 'Boundaries', description: 'Edges, limits, borders that define spaces' },
                    { name: 'Confinement', description: 'Being trapped, enclosed, restricted in movement' },
                    { name: 'Constraint', description: 'Limitations, restrictions, rules that bind' },
                    { name: 'Containment', description: 'Being held, stored, kept within bounds' },
                    { name: 'Obstruction', description: 'Blocked paths, barriers, impediments' },
                    { name: 'Sanctuary', description: 'Safe spaces, protected areas, refuges' }
                ], 'lock'),
                createVector('Breach & Collapse', 'cluster_boundaries_barriers', [
                    { name: 'Breach', description: 'Breaking through, violating boundaries, penetration' },
                    { name: 'Chaos', description: 'Disorder, confusion, loss of structure' },
                    { name: 'Collapse', description: 'Structures falling, systems failing, breakdown' },
                    { name: 'Deconstruction', description: 'Taking apart, dismantling, unbuilding' },
                    { name: 'Reordering', description: 'Restructuring, reorganizing, new arrangements' }
                ], 'alert-triangle')
            ]
        },

        // Cluster 3: Conflict, Obstacles, and Resolution
        {
            id: 'cluster_conflict_resolution',
            name: 'Conflict & Resolution',
            color: '#f39c12',
            description: 'Dreams involving conflicts, obstacles, threats, and their resolution',
            vectors: [
                createVector('Open Conflict', 'cluster_conflict_resolution', [
                    { name: 'Aggression', description: 'Hostile actions, attacks, offensive behavior' },
                    { name: 'Conflict', description: 'Disputes, battles, opposing forces' },
                    { name: 'Confrontation', description: 'Face-to-face challenges, direct opposition' },
                    { name: 'Contention', description: 'Disagreement, competition, rivalry' },
                    { name: 'Violence', description: 'Physical force, harm, destructive actions' }
                ], 'sword'),
                createVector('Threat & Danger', 'cluster_conflict_resolution', [
                    { name: 'Peril', description: 'Immediate danger, life-threatening situations' },
                    { name: 'Danger', description: 'Hazardous situations, risks, threats' },
                    { name: 'Predation', description: 'Being hunted, stalked, preyed upon' },
                    { name: 'Threat', description: 'Looming dangers, potential harm' }
                ], 'alert-circle'),
                createVector('Overcoming Obstacles', 'cluster_conflict_resolution', [
                    { name: 'Struggle', description: 'Difficult efforts, fighting against odds' },
                    { name: 'Resistance', description: 'Opposing forces, pushing back' },
                    { name: 'Resolve', description: 'Determination, finding solutions' },
                    { name: 'Remediation', description: 'Fixing problems, healing damage' },
                    { name: 'Sacrifice', description: 'Giving up something for greater good' },
                    { name: 'Endurance', description: 'Lasting through hardship, perseverance' },
                    { name: 'Persistence', description: 'Continuing despite obstacles' },
                    { name: 'Resilience', description: 'Bouncing back, recovering from setbacks' }
                ], 'shield')
            ]
        },

        // Cluster 4: Control, Power, and Agency
        {
            id: 'cluster_control_power',
            name: 'Control & Power',
            color: '#9b59b6',
            description: 'Dreams about power dynamics, control, authority, and loss of agency',
            vectors: [
                createVector('Assertion of Power', 'cluster_control_power', [
                    { name: 'Agency', description: 'Personal power, ability to act' },
                    { name: 'Autonomy', description: 'Independence, self-governance' },
                    { name: 'Command', description: 'Giving orders, directing others' },
                    { name: 'Control', description: 'Managing, directing, governing' },
                    { name: 'Domination', description: 'Overpowering, ruling, supremacy' },
                    { name: 'Empowerment', description: 'Gaining strength, becoming capable' },
                    { name: 'Projection', description: 'Extending influence, displaying power' }
                ], 'crown'),
                createVector('Authority & Systems', 'cluster_control_power', [
                    { name: 'Authority', description: 'Official power, legitimate control' },
                    { name: 'Custodianship', description: 'Guardianship, protective responsibility' },
                    { name: 'Duty', description: 'Obligations, required actions' },
                    { name: 'Obedience', description: 'Following orders, compliance' },
                    { name: 'Oversight', description: 'Supervision, watching over' },
                    { name: 'Surveillance', description: 'Being watched, monitored' }
                ], 'eye'),
                createVector('Loss of Control', 'cluster_control_power', [
                    { name: 'Distrust', description: 'Lack of faith, suspicion' },
                    { name: 'Impotence', description: 'Powerlessness, inability to act' },
                    { name: 'Manipulation', description: 'Being controlled, used' },
                    { name: 'Powerlessness', description: 'Lack of control, helplessness' },
                    { name: 'Vulnerability', description: 'Exposed to harm, defenseless' }
                ], 'link-2')
            ]
        },

        // Cluster 5: Creation & Emergence
        {
            id: 'cluster_creation_emergence',
            name: 'Creation & Emergence',
            color: '#2ecc71',
            description: 'Dreams involving creation, manifestation, growth, and new beginnings',
            vectors: [
                createVector('Manifestation & Reordering', 'cluster_creation_emergence', [
                    { name: 'Creation', description: 'Making something new, bringing into existence' },
                    { name: 'Emergence', description: 'Coming forth, appearing, developing' },
                    { name: 'Manifestation', description: 'Becoming real, taking form' },
                    { name: 'Novelty', description: 'New things, unprecedented experiences' },
                    { name: 'Permeation', description: 'Spreading through, infiltrating' },
                    { name: 'Reordering', description: 'Rearranging, restructuring' }
                ], 'sparkles'),
                createVector('Potential & Fertility', 'cluster_creation_emergence', [
                    { name: 'Fertility', description: 'Productive capacity, abundance' },
                    { name: 'Nurturing', description: 'Caring for, fostering growth' },
                    { name: 'Potential', description: 'Latent abilities, possibilities' },
                    { name: 'Provision', description: 'Supplying needs, providing resources' }
                ], 'sprout')
            ]
        },

        // Cluster 6: Identity & Consciousness
        {
            id: 'cluster_identity_consciousness',
            name: 'Identity & Consciousness',
            color: '#e67e22',
            description: 'Dreams exploring self-identity, consciousness, transformation, and personal evolution',
            vectors: [
                createVector('Self & Detachment', 'cluster_identity_consciousness', [
                    { name: 'Detachment', description: 'Feeling disconnected, observing from outside, emotional distance' },
                    { name: 'Discomfort', description: 'Physical or emotional unease, awkward situations' },
                    { name: 'Disgust', description: 'Revulsion, rejection, encountering repulsive elements' },
                    { name: 'Disorientation', description: 'Confusion about location/identity, losing bearings' },
                    { name: 'Impassivity', description: 'Emotional numbness, inability to react' },
                    { name: 'Resignation', description: 'Accepting fate, giving up' },
                    { name: 'Self-Discovery', description: 'Learning about oneself, revelations' }
                ], 'user'),
                createVector('Transformation & Change', 'cluster_identity_consciousness', [
                    { name: 'Adaptation', description: 'Adjusting to new situations, evolving abilities' },
                    { name: 'Alteration', description: 'Changing form, modifying appearance' },
                    { name: 'Ascension', description: 'Rising upward, spiritual elevation' },
                    { name: 'Augmentation', description: 'Gaining new abilities, enhancement' },
                    { name: 'Awakening', description: 'Realizing truth, becoming aware' },
                    { name: 'Evolution', description: 'Gradual development, improving' },
                    { name: 'Initiation', description: 'Beginning journeys, rites of passage' },
                    { name: 'Regeneration', description: 'Healing, renewal, restoration' },
                    { name: 'Shift', description: 'Sudden changes, reality alterations' },
                    { name: 'Transformation', description: 'Complete metamorphosis, fundamental changes' },
                    { name: 'Transition', description: 'Moving between states, crossing thresholds' }
                ], 'refresh-cw'),
                createVector('Liberation & Unrestraint', 'cluster_identity_consciousness', [
                    { name: 'Emancipation', description: 'Freedom from bondage, release' },
                    { name: 'Liberation', description: 'Being freed, breaking chains' },
                    { name: 'Unrestraint', description: 'Without limits, unbounded' }
                ], 'unlock')
            ]
        },

        // Cluster 7: Journeys, Movement, and Process
        {
            id: 'cluster_journeys_movement',
            name: 'Journeys & Movement',
            color: '#16a085',
            description: 'Dreams featuring travel, exploration, repetitive processes, and navigation',
            vectors: [
                createVector('Physical Journeys', 'cluster_journeys_movement', [
                    { name: 'Exploration', description: 'Discovering new places, investigating' },
                    { name: 'Journey', description: 'Traveling, going on trips' },
                    { name: 'Passage', description: 'Moving through spaces, transitions' },
                    { name: 'Time Travel', description: 'Moving through time, past/future visits' },
                    { name: 'Traversal', description: 'Crossing spaces, moving through' }
                ], 'map'),
                createVector('Repetitive Processes', 'cluster_journeys_movement', [
                    { name: 'Cycle', description: 'Repeating patterns, circular processes' },
                    { name: 'Performance', description: 'Acting, presenting, showing' },
                    { name: 'Recursion', description: 'Self-referential loops, nested repetition' },
                    { name: 'Repetition', description: 'Doing things over and over' },
                    { name: 'Ritual', description: 'Ceremonial acts, formal procedures' }
                ], 'repeat'),
                createVector('Mental Journeys', 'cluster_journeys_movement', [
                    { name: 'Nostalgia', description: 'Longing for the past, memories' },
                    { name: 'Re-experience', description: 'Reliving moments, repeating experiences' },
                    { name: 'Recollection', description: 'Remembering, bringing back memories' },
                    { name: 'Seeking Clarity', description: 'Looking for understanding, answers' }
                ], 'brain')
            ]
        },

        // Cluster 8: Perception, Reality, and Deception
        {
            id: 'cluster_perception_reality',
            name: 'Perception & Reality',
            color: '#8e44ad',
            description: 'Dreams questioning reality, involving deception, revelation, and altered perception',
            vectors: [
                createVector('Observation & Awareness', 'cluster_perception_reality', [
                    { name: 'Awareness', description: 'Conscious recognition, understanding' },
                    { name: 'Observation', description: 'Watching, noticing, studying' },
                    { name: 'Perception', description: 'How things are seen or understood' },
                    { name: 'Scrutiny', description: 'Close examination, detailed inspection' },
                    { name: 'Vigilance', description: 'Watchfulness, alertness' }
                ], 'eye'),
                createVector('Revelation & Discovery', 'cluster_perception_reality', [
                    { name: 'Discovery', description: 'Finding something new or hidden' },
                    { name: 'Disclosure', description: 'Revealing secrets, exposing truth' },
                    { name: 'Encounter', description: 'Meeting, coming across' },
                    { name: 'Revelation', description: 'Sudden understanding, unveiled truth' }
                ], 'lightbulb'),
                createVector('Truth vs. Illusion', 'cluster_perception_reality', [
                    { name: 'Authenticity', description: 'Genuine, real, true nature' },
                    { name: 'Deception', description: 'Tricks, lies, false appearances' },
                    { name: 'Discrepancy', description: 'Inconsistencies, things not matching' },
                    { name: 'Disillusionment', description: 'Loss of false beliefs' },
                    { name: 'Elusiveness', description: 'Hard to grasp, slipping away' },
                    { name: 'Misunderstanding', description: 'Wrong interpretations, confusion' },
                    { name: 'Perspective', description: 'Point of view, way of seeing' },
                    { name: 'Reality', description: 'What is real vs. imagined' },
                    { name: 'Simulation', description: 'Artificial reality, pretense' }
                ], 'layers')
            ]
        },

        // Cluster 9: Relationships & Connection
        {
            id: 'cluster_relationships_connection',
            name: 'Relationships & Connection',
            color: '#e74c8c',
            description: 'Dreams about interpersonal connections, social dynamics, and emotional bonds',
            vectors: [
                createVector('Forming Connections', 'cluster_relationships_connection', [
                    { name: 'Affection', description: 'Love, care, warm feelings' },
                    { name: 'Connection', description: 'Bonds, links, relationships' },
                    { name: 'Interconnection', description: 'Multiple connections, networks' },
                    { name: 'Intimacy', description: 'Close personal connections' },
                    { name: 'Reconnection', description: 'Reuniting, finding again' },
                    { name: 'Relationships', description: 'Interpersonal dynamics' }
                ], 'heart'),
                createVector('Social & Emotional Dynamics', 'cluster_relationships_connection', [
                    { name: 'Approval', description: 'Seeking acceptance, validation' },
                    { name: 'Communication', description: 'Exchanging information, talking' },
                    { name: 'Empathy', description: 'Understanding others\' feelings' },
                    { name: 'Judgment', description: 'Being evaluated, evaluating others' },
                    { name: 'Longing', description: 'Yearning for connection' },
                    { name: 'Negotiation', description: 'Working out agreements' },
                    { name: 'Reconciliation', description: 'Making peace, resolving conflicts' }
                ], 'users'),
                createVector('Social Division', 'cluster_relationships_connection', [
                    { name: 'Disconnection', description: 'Loss of connection, isolation' },
                    { name: 'Disengagement', description: 'Withdrawing, pulling away' },
                    { name: 'Exclusion', description: 'Being left out, rejected' }
                ], 'user-x')
            ]
        },

        // Cluster 10: Nature & Elements
        {
            id: 'cluster_nature_elements',
            name: 'Nature & Elements',
            color: '#27ae60',
            description: 'Dreams featuring natural forces, environments, and elemental themes',
            vectors: [
                createVector('Natural Forces', 'cluster_nature_elements', [
                    { name: 'Storm', description: 'Weather phenomena, natural power' },
                    { name: 'Fire', description: 'Burning, destruction, transformation through heat' },
                    { name: 'Water', description: 'Floods, drowning, cleansing, emotional depths' },
                    { name: 'Earth', description: 'Grounding, stability, burial, growth' },
                    { name: 'Air', description: 'Wind, breath, freedom, communication' }
                ], 'cloud-lightning'),
                createVector('Natural Environments', 'cluster_nature_elements', [
                    { name: 'Forest', description: 'Getting lost, finding paths, natural sanctuary' },
                    { name: 'Ocean', description: 'Vast unknown, depths, waves of emotion' },
                    { name: 'Mountain', description: 'Climbing, achievement, obstacles' },
                    { name: 'Desert', description: 'Isolation, survival, spiritual journey' },
                    { name: 'Garden', description: 'Cultivation, beauty, paradise, growth' }
                ], 'trees')
            ]
        },

        // Cluster 11: Technology & Digital
        {
            id: 'cluster_technology_digital',
            name: 'Technology & Digital',
            color: '#3498db',
            description: 'Dreams involving technology, digital existence, and human-machine interaction',
            vectors: [
                createVector('Digital Existence', 'cluster_technology_digital', [
                    { name: 'Virtual Reality', description: 'Simulated worlds, questioning reality' },
                    { name: 'Social Media', description: 'Connection/disconnection, public persona' },
                    { name: 'Gaming', description: 'Competition, alternate lives, achievement' },
                    { name: 'Glitches', description: 'Reality breaking down, system errors' }
                ], 'monitor'),
                createVector('Technological Control', 'cluster_technology_digital', [
                    { name: 'Automation', description: 'Loss of human control, efficiency' },
                    { name: 'Surveillance Tech', description: 'Being watched through devices' },
                    { name: 'AI/Robots', description: 'Non-human intelligence, replacement fears' },
                    { name: 'Connectivity', description: 'Networks, being plugged in/unplugged' }
                ], 'cpu')
            ]
        }
    ];

    return {
        version: '1.0.0',
        clusters,
        lastModified: new Date(),
        source: 'default',
        metadata: {
            author: 'OneiroMetrics',
            description: 'Default dream taxonomy based on common dream research patterns',
            createdAt: new Date(),
            totalClusters: clusters.length,
            totalVectors: clusters.reduce((sum, c) => sum + c.vectors.length, 0),
            totalThemes: clusters.reduce((sum, c) => 
                sum + c.vectors.reduce((vSum, v) => vSum + v.themes.length, 0), 0
            )
        }
    };
}