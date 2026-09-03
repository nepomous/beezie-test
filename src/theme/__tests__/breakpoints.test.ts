import { breakpoints, getBreakpoint } from '../breakpoints';

describe('getBreakpoint', () => {
  it('returns mobile for widths below the tablet breakpoint', () => {
    expect(getBreakpoint(0)).toBe('mobile');
    expect(getBreakpoint(375)).toBe('mobile');
    expect(getBreakpoint(breakpoints.tablet - 1)).toBe('mobile');
  });

  it('returns tablet for widths between tablet and desktop breakpoints', () => {
    expect(getBreakpoint(breakpoints.tablet)).toBe('tablet');
    expect(getBreakpoint(breakpoints.desktop - 1)).toBe('tablet');
  });

  it('returns desktop for widths at or above the desktop breakpoint', () => {
    expect(getBreakpoint(breakpoints.desktop)).toBe('desktop');
    expect(getBreakpoint(1440)).toBe('desktop');
  });
});
