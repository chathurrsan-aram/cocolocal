export const shop = {
    name: "Coco Local", url: "https://cocolocal.co.uk",
    address: "210 High Road, South Benfleet, SS7 5LD",
    phone: "07483 423869", telephone: "tel:+447483423869", email: "210cocolocal@gmail.com",
    facebook: "https://www.facebook.com/profile.php?id=61577283069366",
    instagram: "https://www.instagram.com/cocolocal_/",
    directions: "https://www.google.com/maps/dir/?api=1&destination=210+High+Road+South+Benfleet+SS7+5LD",
    hours: [
        { days: "Monday–Thursday", time: "7am–10pm", schema: ["Monday", "Tuesday", "Wednesday", "Thursday"], opens: "07:00", closes: "22:00" },
        { days: "Friday–Saturday", time: "7am–11pm", schema: ["Friday", "Saturday"], opens: "07:00", closes: "23:00" },
        { days: "Sunday", time: "8:30am–9pm", schema: ["Sunday"], opens: "08:30", closes: "21:00" },
    ],
};
export const categories = [
    { id: "groceries", title: "Groceries & chilled essentials", image: "chilled", alt: "Milk, chilled drinks and grocery shelves inside Coco Local", description: "For the fridge, the cupboard and tonight’s top-up shop. Browse everyday groceries and chilled essentials in store." },
    { id: "snacks", title: "Snacks & sweet treats", image: "snacks", alt: "Crisps, sweets and chocolate on the front shelves", description: "A little something for the journey home, a film night or your afternoon break. Explore our crisps, chocolate and confectionery." },
    { id: "slushies", title: "Slushies & soft drinks", image: "slush", alt: "A red and blue slushie in front of the Coco’s slush machine", description: "Take a little chill break with a Coco’s slushie, or browse our soft drinks. Ask in store for today’s flavours and sizes." },
    { id: "household", title: "Household & personal care", image: "household", alt: "Cleaning products and household essentials in the shop aisle", description: "The useful things you’ve run out of: cleaning and laundry supplies, toiletries and everyday household essentials." },
    { id: "pets", title: "Pet food", image: "pets", alt: "Cat and dog food on Coco Local’s pet-food shelves", description: "Pick up something for the pets too. Our shelves include cat and dog food, with the available selection changing in store." },
    { id: "world-foods", title: "World foods & cupboard staples", image: "grocery", alt: "Coco Local grocery aisle with packaged foods and cupboard staples", description: "Explore the grocery aisles for world foods and cupboard staples. Looking for a particular ingredient? Give us a call before you visit." },
    { id: "everyday-extras", title: "DIY, stationery & party essentials", image: "household", alt: "Household shelves with disposable plates, trays and everyday supplies", description: "Little extras for home, work and get-togethers. Ask about our stationery, DIY accessories and party essentials when you pop in." },
    { id: "off-licence", title: "Beers, wines & spirits", image: "drinks", alt: "Wine and beer shelves inside Coco Local", description: "Browse our off-licence selection in store. Call to check a particular bottle or pack before making a special trip. Alcohol is for adults aged 18 and over." },
];
export const navigation = [{ href: "/", label: "Home" }, { href: "/products", label: "Our range" }, { href: "/about", label: "About us" }, { href: "/contact", label: "Find us" }];
