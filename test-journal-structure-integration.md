# Journal Structure Integration Test

## Test 1: AV Journal Structure

> [!av-journal] 2025-06-01 - Audio Visual Journal Entry
> 
> > [!dream-diary] Lucid Flight Dream
> > I was flying over a vast city landscape. The buildings seemed to stretch endlessly below me. I remember feeling a sense of freedom and weightlessness as I soared through the clouds.
> > 
> > > [!dream-metrics]
> > > Words: 156, Sensory Detail: 4, Emotional Recall: 5, Lost Segments: 1, Descriptiveness: 4, Confidence Score: 4

## Test 2: Legacy Journal Entry Structure

> [!journal-entry] 2025-06-01 - Traditional Journal Entry
> 
> > [!dream-diary] Ocean Adventure Dream
> > I found myself underwater in a crystal-clear ocean. Colorful fish swam around me, and I could breathe normally underwater. The coral reef was vibrant and alive.
> > 
> > > [!dream-metrics]
> > > Words: 142, Sensory Detail: 5, Emotional Recall: 3, Lost Segments: 0, Descriptiveness: 4, Confidence Score: 5

## Test 3: Simple Dream Structure

> [!dream] Night Vision
> Basic dream content here without nested structure.
> 
> > [!metrics]
> > Words: 89, Sensory Detail: 2, Emotional Recall: 2, Lost Segments: 2, Descriptiveness: 2, Confidence Score: 3

## Test 4: Unrecognized Callout (should be ignored)

> [!random-callout] This should be ignored
> Random content that shouldn't be parsed as a dream entry.

## Test 5: Mixed Structure (should handle gracefully)

> [!av-journal] 2025-06-01 - Mixed Test
> 
> > [!dream-diary] Multi-part Dream
> > Part one of the dream with vivid imagery.
> > 
> > > [!dream-metrics]  
> > > Words: 201, Sensory Detail: 4, Emotional Recall: 4, Lost Segments: 1, Descriptiveness: 3, Confidence Score: 4
> > 
> > [!dream-diary] Second Dream Segment
> > Part two of the dream sequence.
> > 
> > > [!dream-metrics]
> > > Words: 89, Sensory Detail: 3, Emotional Recall: 3, Lost Segments: 0, Descriptiveness: 3, Confidence Score: 4 