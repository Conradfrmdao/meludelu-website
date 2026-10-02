// Interim photography from Unsplash (free for commercial use under the Unsplash licence).
// Replace with Meludelu's own photography before launch; components do not need to change.
export function unsplash(id: string, width = 1600): string {
  return `https://images.unsplash.com/photo-${id}?w=${width}&q=80&auto=format&fit=crop`;
}

export const siteImages = {
  heroWomen: { url: unsplash("1747396206869-75ea57b325ce"), alt: "Woman in an oat linen shift dress" },
  heroBaby: { url: unsplash("1773243086631-962baefccd8a"), alt: "Newborn asleep in a cream knit cardigan" },
  womenFeature: { url: unsplash("1625158244856-e5e20f733c1f"), alt: "Woman in a white linen dress in a field of red poppies" },
  babyFeature: { url: unsplash("1587116215900-bb2bba7c7cff"), alt: "Baby in a soft pink knit lying on a cream blanket" },
  editorial: { url: unsplash("1633008004535-b255bab275cc", 2000), alt: "Folded knitwear in cream and oatmeal" },
  story: { url: unsplash("1641642231157-0849081598a2"), alt: "A stack of folded knits on a wooden chair" },
};
