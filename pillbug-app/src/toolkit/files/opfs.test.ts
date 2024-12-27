import { expect, test } from 'vitest';
import { dirname, basename, pathjoin } from "./opfs";

test('dirname rooted paths', () => {
    expect(dirname('/one/two')).toBe("/one");
    expect(dirname('/one/two/three')).toBe("/one/two");
    expect(dirname('/one')).toBe("/");
    expect(dirname('/')).toBe("/");
    expect(dirname('/one/')).toBe("/one"); // maybe funky behavior, trailing slashes
})


test('dirname unrooted paths', () => {
    expect(dirname('one/two')).toBe("/one");
    expect(dirname('one/two/three')).toBe("/one/two");
    expect(dirname('one')).toBe("/");
    expect(dirname('')).toBe("/");
})

test('pathjoin', () => {
    expect(pathjoin("/", "one")).toBe("/one")
    expect(pathjoin("/one", "two")).toBe("/one/two")
    expect(pathjoin("/one", "two/three")).toBe("/one/two/three")
    expect(pathjoin("/one/two", "three")).toBe("/one/two/three")
})

test('basename', () => {
    expect(basename('/one/two')).toBe("two");
    expect(basename('/one/two/three')).toBe("three");
    expect(basename('/one')).toBe("one");
    expect(basename('/')).toBe("");
    expect(basename('/one/')).toBe(""); // maybe funky behavior, trailing slashes
})