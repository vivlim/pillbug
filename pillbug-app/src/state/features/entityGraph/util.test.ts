
import { expect, test } from 'vitest';
import { denormalizeProperties } from './util';

test('denormalize basic', () => {
    const normalizedPost = {
        author: '1',
        content: 'hello',
    }

    const authors: Record<string, { name: string }> = {
        '1': {
            name: 'me'
        }
    }

    const state = {
        posts: [normalizedPost],
        authors: authors,
    }

    const result = denormalizeProperties(state, normalizedPost, {
        'author': (s, id) => s.authors[id]
    })

    expect(result).toEqual({
        author: {
            name: 'me',
        },
        content: 'hello',
    })
})