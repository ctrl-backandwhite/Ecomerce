/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  categoryLookup — CJ Category JSON → product category maps  ║
 * ║                                                              ║
 * ║  categoryFirstName  →  product.category  (main category)    ║
 * ║  categorySecondName →  product.subcategory (sub-category)    ║
 * ║                                                              ║
 * ║  Provides two lookup directions:                             ║
 * ║  • by leaf categoryId   (level 3)                           ║
 * ║  • by leaf categoryName (level 3, case-insensitive)         ║
 * ║  • by second-level categorySecondId (level 2, fallback)     ║
 * ╚══════════════════════════════════════════════════════════════╝
 */

// ─── Inline category tree (derived from CJ API /product/getCategory) ─────────
// Structure mirrors the JSON: categoryFirstName → categorySecondNames → leaf names
// This avoids a runtime JSON import while keeping the data fully typed.

interface LeafEntry {
  id: string;
  name: string;
}
interface SecondEntry {
  id: string;
  name: string;
  leaves: LeafEntry[];
}
interface FirstEntry {
  id: string;
  name: string;
  seconds: SecondEntry[];
}

const CJ_TREE: FirstEntry[] = [
  {
    id: "2FE8A083-5E7B-4179-896D-561EA116F730",
    name: "Women's Clothing",
    seconds: [
      {
        id: "23DDAF61-8F6C-40F7-9F1F-DC9BB25450B6",
        name: "Accessories",
        leaves: [
          { id: "0DC4DF6F-4EC5-47DF-B20D-863ADF69319F", name: "Scarves & Wraps" },
          { id: "1374953557614268416", name: "Face Masks" },
          { id: "1E4A1FD7-738C-4AEF-9793-BDE062158BD6", name: "Belts & Cummerbunds" },
          { id: "2EB0613C-E73D-4A09-A21C-90E5F1C227D3", name: "Woman Prescription Glasses" },
          { id: "3B4C41C0-EA46-4F03-A2F4-9A9948947439", name: "Eyewear & Accessories" },
          { id: "7B2039D9-FF87-4514-954B-021289724271", name: "Woman Gloves & Mittens" },
          { id: "96EBD53A-C941-445C-BBBD-C1D9F858E433", name: "Woman Socks" },
          { id: "F72DD534-E394-4958-B591-149C488648D7", name: "Woman Hats & Caps" },
        ],
      },
      {
        id: "2502190915541622500",
        name: "Couple & Parent-Child Clothing",
        leaves: [
          { id: "2502190916161603800", name: "Couple&Parent-Child Sweatshirts" },
          { id: "2502190916291603600", name: "Couple&Parent-Child Short-Sleeves" },
          { id: "2502190916401605200", name: "Couple&Parent-Child Jackets" },
          { id: "2502190916551623100", name: "Couple&Parent-Child Tops" },
          { id: "2502190917131623500", name: "Couple&Parent-Child Suits" },
          { id: "2502190917241609600", name: "Couple&Parent-Child Pants" },
        ],
      },
      {
        id: "422D4713-284A-49EE-8E53-680B7DCC72FE",
        name: "Tops & Sets",
        leaves: [
          { id: "1357251872037146624", name: "Ladies Short Sleeve" },
          { id: "2409230541301627300", name: "Women's Camis" },
          { id: "2502140253001614100", name: "Women's Vests" },
          { id: "2502190153271613100", name: "Women's Short-Sleeved Shirts" },
          { id: "2502190153531612600", name: "Women's Long-Sleeved Shirts" },
          { id: "5A3E7341-18B5-4C61-BFCD-8965B3479A9A", name: "Blouses & Shirts" },
          { id: "5E656DFB-9BAE-44DD-A755-40AFA2E0E686", name: "Woman Hoodies & Sweatshirts" },
          { id: "7B69E34F-43A3-4143-A22D-30786EE97998", name: "Jumpsuits" },
          { id: "7D611AF5-5135-4BBB-86F6-E80179F8E5B8", name: "Rompers" },
          { id: "D2432903-0D4E-4787-886F-D3D9DA7890D9", name: "Lady Dresses" },
          { id: "DE9C662C-3F48-4855-87E7-E18733EFF6D2", name: "Sweaters" },
          { id: "ECDBD4C4-7467-4831-9F55-740E3C7968BE", name: "Suits & Sets" },
        ],
      },
      {
        id: "4257920C-6E7D-4B56-B031-0FC7AC6EF981",
        name: "Bottoms",
        leaves: [
          { id: "396E962A-5632-49C2-B9BF-9529DE3B9141", name: "Leggings" },
          { id: "3B8946E7-B608-4DAB-B2F0-C425B7875035", name: "Skirts" },
          { id: "63584B9B-5275-4268-8BEA-7D3C7A7BB925", name: "Woman Jeans" },
          { id: "8A22518D-0C6F-430D-8CD9-7E043062A279", name: "Woman Shorts" },
          { id: "9694B484-7EA0-4D71-993B-9CF02D24B271", name: "Pants & Capris" },
          { id: "A7DE167B-ECFF-481E-A52A-2E7937BFAA95", name: "Wide Leg Pants" },
        ],
      },
      {
        id: "773E0DBE-EEB6-40E9-984F-4ACFB0F58C9A",
        name: "Outerwear & Jackets",
        leaves: [
          { id: "07398ADB-FC5E-4CC4-AD00-EB230E779E88", name: "Blazers" },
          { id: "1366AF62-E9CB-4834-9EC9-6126C077B5E0", name: "Wool & Blend" },
          { id: "2409230541081607100", name: "Women's Padded Jackets" },
          { id: "441DA450-5E5F-41DF-8911-3BAE883C30E8", name: "Woman Trench" },
          { id: "4CF7E664-A644-4B96-951B-B76FA973320A", name: "Basic Jacket" },
          { id: "D680731F-1AE8-46E4-9BE7-E98C39F07E1E", name: "Leather & Suede" },
          { id: "F5C6B4C3-0362-40D3-811B-19C37C5C4AC2", name: "Real Fur" },
        ],
      },
      {
        id: "85CC5FF8-1CAC-4725-9F07-C778AB627E1B",
        name: "Weddings & Events",
        leaves: [
          { id: "1AFD1C87-0BB1-4BAB-AA1A-D082E767811C", name: "Cocktail Dresses" },
          { id: "30E8E5CF-FBBA-48DA-84DD-E29D733089E0", name: "Evening Dresses" },
          { id: "6C2516C4-F999-434C-B3F4-467FAFA13E2E", name: "Bridesmaid Dresses" },
          { id: "88E43313-84C6-4550-B2C7-83A415AFA2DD", name: "Prom Dresses" },
          { id: "935BCF1B-5D61-422F-8439-19179FE8B492", name: "Wedding Dresses" },
          { id: "95C53342-6277-4FEC-B450-6D3F9EEDD6A1", name: "Flower Girl Dresses" },
        ],
      },
    ],
  },
  {
    id: "2409110611570657700",
    name: "Pet Supplies",
    seconds: [
      {
        id: "2410110335471602500",
        name: "Pet Toys",
        leaves: [
          { id: "2410110339311602900", name: "Pet Chase Toys" },
          { id: "2410110339451623300", name: "Pet Chew Toys" },
          { id: "2410110340031614900", name: "Pet Training and Educational Toys" },
          { id: "2410110340161623400", name: "Pet Sound Toys" },
          { id: "2410110340291603400", name: "Pet Tunnel Toys" },
          { id: "2410110340411608400", name: "Pet Toy Set" },
          { id: "2410110340531618900", name: "Pet Plush Toys" },
        ],
      },
      {
        id: "2410110337031615300",
        name: "Pet Drinking & Feeding",
        leaves: [
          { id: "2410110341061612000", name: "Pet Bowls" },
          { id: "2410110341331606800", name: "Pet Drinking Tools" },
          { id: "2410110341451628800", name: "Pet Feeding Tools" },
        ],
      },
      {
        id: "2410110337231611800",
        name: "Pet Outdoor Supplies",
        leaves: [
          { id: "2410110342021620700", name: "Barking Control Equipments" },
          { id: "2410110342161616300", name: "Trainers" },
          { id: "2410110342321607200", name: "Dog Training Pads & Diapers" },
          { id: "2410110342461620700", name: "Pet Snacks" },
          { id: "2410110342571606700", name: "Pet Bags" },
          { id: "2410110343091603200", name: "Pet Seat Belts" },
          { id: "2410110343211625200", name: "Pet Car Mats" },
          { id: "2410110343361612300", name: "Pet Guardrails" },
        ],
      },
      {
        id: "2410110337451628400",
        name: "Bird Supplies",
        leaves: [
          { id: "2410110343481625100", name: "Bird Feeders" },
          { id: "2410110344031621500", name: "Bird Cages" },
          { id: "2410110344161629700", name: "Bird Swings" },
          { id: "2410110344291609800", name: "Bird Toys" },
          { id: "2410110344421608600", name: "Bird Travel Bags" },
          { id: "2410110344551611100", name: "Bird Accessories" },
        ],
      },
      {
        id: "2410110338011611100",
        name: "Fish & Aquatic Pets",
        leaves: [
          { id: "2410110345121610800", name: "Fish Tanks" },
          { id: "2410110345231624700", name: "Fish Tank Decorations" },
          { id: "2410110347591607300", name: "Fish Tank Cleaning Supplies" },
        ],
      },
      {
        id: "2410110338151629800",
        name: "Pet Apparels",
        leaves: [
          { id: "2410110348131619300", name: "Pet Dresses" },
          { id: "2410110348271614500", name: "Pet Tops" },
          { id: "2410110348401611500", name: "Pet Sweaters" },
          { id: "2410110348531624100", name: "Pet Sweatshirts & Hoodies" },
          { id: "2410110349061619800", name: "Pet Coats & Jackets" },
          { id: "2410110349201623700", name: "Pet Jumpsuits" },
          { id: "2410110349341618600", name: "Pet Pajamas" },
          { id: "2410110349471606300", name: "Pet Clothings" },
          { id: "2410110350021615300", name: "Pet Functional Clothings" },
          { id: "2410110350161600700", name: "Pet Clothing Sets" },
          { id: "2410110350311612500", name: "Pet Down & Parkas" },
          { id: "2410110350451606900", name: "Pet Shoes & Socks" },
          { id: "2410110350591620800", name: "Pet Scarves" },
          { id: "2410110351121613900", name: "Pet Bags" },
        ],
      },
      {
        id: "2410110338321625700",
        name: "Pet Collars, Harnesses & Accessories",
        leaves: [
          { id: "2410110351231616600", name: "Pet Hair Accessories" },
          { id: "2410110351401621300", name: "Pet Bows & Ties" },
          { id: "2410110351521627800", name: "Pet Necklaces" },
          { id: "2410110352051607900", name: "Pet Headwears" },
          { id: "2410110352191611200", name: "Pet Glasses" },
          { id: "2410110352331629800", name: "Pet Collars" },
          { id: "2410110352471611400", name: "Pet Leashes" },
          { id: "2410110352591600400", name: "Pet Harnesses" },
          { id: "2410110353131601000", name: "Pet Muzzles" },
          { id: "2410110353301600600", name: "Pet Collar, Leash & Harness Sets" },
          { id: "2410110354301620700", name: "Custom Pet tags, Collars, Leashes & Harnesses" },
        ],
      },
      {
        id: "2410110338471603600",
        name: "Pet Groomings",
        leaves: [
          { id: "2410110354491625800", name: "Pet Hair Removers & Combs" },
          { id: "2410110355021623200", name: "Pet Nail Polishers" },
          { id: "2410110355151622300", name: "Pet Shower Products" },
          { id: "2410110355321622400", name: "Pet Towels" },
        ],
      },
      {
        id: "2410110338591602500",
        name: "Pet Furnitures",
        leaves: [
          { id: "2410110355491614000", name: "Cat Scratching Posts" },
          { id: "2410110356041603300", name: "Pet Furniture Protectors" },
          { id: "2410110356161627200", name: "Cat Trees & Condos" },
          { id: "2410110356301618100", name: "Pet Furniture Tools" },
          { id: "2410110356441603600", name: "Pet Houses & Cages" },
          { id: "2410110356561607500", name: "Dog Stairs & Steps" },
          { id: "2410110357091627600", name: "Pet Tents" },
          { id: "2410110357221629500", name: "Pet Hammocks" },
        ],
      },
      {
        id: "2410110339121629200",
        name: "Pet Bedding",
        leaves: [
          { id: "2410110357391611900", name: "Pet Mats" },
          { id: "2410110357511615700", name: "Pet Nests" },
          { id: "2410110358051626100", name: "Pet Beds" },
          { id: "2410110358191601900", name: "Pet Blankets & Quilts" },
        ],
      },
    ],
  },
  {
    id: "52FC6CA5-669B-4D0B-B1AC-415675931399",
    name: "Home, Garden & Furniture",
    seconds: [
      {
        id: "1AD00A3C-465A-430A-9820-F2D097FDA53A",
        name: "Home Textiles",
        leaves: [
          { id: "1A9A9965-A914-46D7-B8E2-49AD256F2B6B", name: "Curtains" },
          { id: "2601070550351602500", name: "Floor Mats" },
          { id: "300CC260-CF9D-4AEA-9FC2-6C8DB8A35B51", name: "Cushion Covers" },
          { id: "331F43CE-CA1D-45F2-BE2A-8AE62EC10251", name: "Towels" },
          { id: "36F37524-3EAF-4E20-B989-10137FD0ED70", name: "Comforters" },
          { id: "496E6FFC-4BC4-4CA6-8225-5BC0D56E8E11", name: "Bedding Sets" },
          { id: "6939DA08-F7F8-48FB-A7E8-169AEAC92404", name: "Pillows" },
        ],
      },
      {
        id: "2180A6DC-32EC-44B2-8FD4-CE3DD6DB4C19",
        name: "Arts, Crafts & Sewing",
        leaves: [
          { id: "2409230854411618700", name: "Decor Paintings" },
          { id: "664B9B04-4697-437A-AA46-631EFCC3DF03", name: "Lace" },
          { id: "93671B1A-DE8F-4398-B139-8B2214206648", name: "Apparel Sewing & Fabric" },
          { id: "C8AA2A38-B339-468F-87D3-AD2DB0697F93", name: "Cross-Stitch" },
          { id: "D60B979B-3779-47BD-8F55-D17581817273", name: "Ribbons" },
          { id: "EEC881A3-0A55-4BBF-9ADB-EB290116A67A", name: "Diamond Painting Cross Stitch" },
          { id: "FD2629CD-9379-4EC4-BCF3-5998AEA3E642", name: "Fabric" },
        ],
      },
      {
        id: "2502140306341614500",
        name: "Musical Instruments",
        leaves: [
          { id: "2502140306571605000", name: "Guitars" },
          { id: "2502140307181607100", name: "Violins" },
        ],
      },
      {
        id: "7D40D0BB-1466-4EEA-B275-0EB4CC0020D8",
        name: "Festive & Party Supplies",
        leaves: [
          { id: "621F9C38-814C-40C2-9F9D-7CE12DB8FB4C", name: "Christmas Decoration Supplies" },
          { id: "768DE38B-3FCB-4DD1-B14C-687F03F78D0A", name: "Invitation Cards" },
          { id: "779524FE-7E6E-4948-A739-999E07602BE5", name: "Cake Decorating Supplies" },
          { id: "7B975B46-46DF-4C3A-BC58-1F4F2DDB9413", name: "Decorative Flowers & Wreaths" },
          { id: "9F52617D-F420-4FA7-8F25-53A9577A9111", name: "Party Masks" },
          { id: "C329460A-9074-4E42-B1FD-D9E91568A64B", name: "Event & Party Supplies" },
        ],
      },
      {
        id: "D5D120D0-1262-461A-97C5-74AC732625B5",
        name: "Kitchen, Dining & Bar",
        leaves: [
          { id: "0F4CFA22-8B97-4016-94A6-18066B9BD05C", name: "Dinnerware" },
          { id: "23ADD7CB-065A-4A02-B8E8-43D3F041B90B", name: "Kitchen Knives & Accessories" },
          { id: "7C8E809A-460A-4F50-8A2F-B62AD010BFF8", name: "Bakeware" },
          { id: "BEDFD1CC-E7CC-438F-9050-D7737904203D", name: "Barware" },
          { id: "CF330457-0E5B-4FAF-9BAE-7D2C247BD8DE", name: "Drinkware" },
          { id: "E448A723-43DC-4BD8-A9AD-2FB9699338B4", name: "Cooking Tools" },
        ],
      },
      {
        id: "ED8E61AA-2260-4E03-BA66-DEAE3DF02CDC",
        name: "Home Storage",
        leaves: [
          { id: "1697200256204677120", name: "Adult Wellness" },
          { id: "1711658677159079936", name: "Seasonal products" },
          { id: "2409230543341601500", name: "Stationeries" },
          { id: "2410301014451618100", name: "Furniture" },
          { id: "2502140315331600200", name: "Storage Bags & Cases & Boxes" },
          { id: "2601070551041636400", name: "First Aid Supplies" },
          { id: "56845C3D-4D9E-4729-B5D4-6D7DE310C031", name: "Kitchen Storage" },
          { id: "87CF251F-8D11-4DE0-A154-9694D9858EB3", name: "Home Office Storage" },
          { id: "A0E89009-FFD6-4B2E-906A-8076DF45B32C", name: "Clothing & Wardrobe Storage" },
          { id: "B62EE40F-7650-4715-A7A5-BA227540593C", name: "Bathroom Storage" },
          { id: "C1394E10-1EDF-4107-AA93-F142B44C3136", name: "Storage Bottles & Jars" },
        ],
      },
    ],
  },
  {
    id: "2C7D4A0B-1AB2-41EC-8F9E-13DC31B1C902",
    name: "Health, Beauty & Hair",
    seconds: [
      {
        id: "01FD30A0-118E-4269-A6D2-8415E9C163BA",
        name: "Nail Art & Tools",
        leaves: [
          { id: "1B1A9B82-1833-4721-88CA-86F5F542D7A5", name: "Nail Glitters" },
          { id: "25A6516D-3AE3-4207-BA00-6FD3CCE20201", name: "Stickers & Decals" },
          { id: "26F7660F-A00A-468A-BA29-E61A465C0D0B", name: "Nail Decorations" },
          { id: "9F96CE84-962D-4992-81DC-BF79A4A9002D", name: "Nail Gel" },
          { id: "E157D35B-156B-49F6-A678-7C55D4E81D6C", name: "Nail Dryers" },
          { id: "EADB666A-12A5-4FA1-AD1F-BC351A7E7AF5", name: "Nail Art Kits" },
        ],
      },
      {
        id: "2409190607141613700",
        name: "Food & Health",
        leaves: [
          { id: "2409190611101616600", name: "Health Care Products" },
        ],
      },
      {
        id: "3B5BDD4D-34F4-4807-BC6C-943C2C1BCDB8",
        name: "Hair & Accessories",
        leaves: [
          { id: "2502140903111619100", name: "Headband & Hair Band & Hairpin" },
          { id: "B3D7C9CA-9B1E-4E97-8310-39083F0308C9", name: "Human Hair" },
        ],
      },
      {
        id: "3C677D1C-C1AA-461F-851F-3E8A42C82984",
        name: "Synthetic Hair",
        leaves: [
          { id: "C8148B69-25D4-4DEE-8388-3D627D35163D", name: "Cosplay Wigs" },
        ],
      },
      {
        id: "6289460B-5660-468A-AE43-3D619A05AAC2",
        name: "Skin Care",
        leaves: [
          { id: "5DE3BC4F-41A8-4806-8E66-47537903123A", name: "Razor" },
          { id: "88AF62DE-5586-40E4-A287-864523D9AE50", name: "Face Masks" },
          { id: "B6A8B971-793B-4F9E-AA56-3A5D12F63827", name: "Sun Care" },
          { id: "CB1A9CEF-8333-4D2F-B19A-418C6DE376C7", name: "Essential Oil" },
          { id: "E0238E88-0C63-427F-812E-BA1FCE4C67B4", name: "Body Care" },
          { id: "EDE3FAD9-0E6C-4F7C-9016-A2299469AA7C", name: "Facial Care" },
        ],
      },
      {
        id: "71BB975B-A54E-489E-95BF-3105433858D0",
        name: "Hair Weaves",
        leaves: [
          { id: "4B3ED595-B44D-4A7A-81F8-B0E3B272B62A", name: "Pre-Colored One Pack" },
          { id: "57DCC498-DF74-4E8F-929F-F4DF256AA72D", name: "Hair Weaving" },
          { id: "9A3105F2-AFFD-42FC-8A52-D0FB4ACDCB63", name: "Hair Styling" },
          { id: "C6368BAF-38E8-4741-86F3-66878F069841", name: "Salon Bundle Hair" },
          { id: "D7EF49F5-F75D-45DC-A0BB-CFCFF4346E18", name: "Pre-Colored Hair Weave" },
        ],
      },
      {
        id: "7EAF3E36-620B-4D78-818F-EE80955462A4",
        name: "Makeup",
        leaves: [
          { id: "2502140902411611700", name: "Eyebrow Pencil" },
          { id: "426792A7-4906-403D-AD17-8293AFF00E66", name: "Makeup Set" },
          { id: "8FB2C16C-4C1B-4B5A-89F8-BC30FB2C442A", name: "Eyeshadow" },
          { id: "A30E8F55-DC2C-4842-9372-91B96DEFDCC2", name: "Makeup Brushes" },
          { id: "B68DF53F-4DD5-4659-A530-66D414CF2147", name: "Lipstick" },
          { id: "E31E5996-7B86-4FEC-B929-9AEB11E76853", name: "False Eyelashes" },
        ],
      },
      {
        id: "BF7AE6E9-E175-48FD-B1E3-3CF0126C90D0",
        name: "Wigs & Extensions",
        leaves: [
          { id: "44733589-BEE4-448D-86F9-A1B5A9710C79", name: "Human Hair Wigs" },
          { id: "6ADDD8E4-4141-4B5A-9A85-6D87FED7799C", name: "Synthetic Hair Pieces" },
          { id: "6C4CEB64-10FD-447E-BB1D-F6F5C1E71442", name: "Synthetic Lace Wigs" },
          { id: "93B5702F-DEF0-443D-847B-9287DEDF5BD9", name: "Human Hair Lace Wigs" },
          { id: "B30591BD-0353-4791-8BF6-F4876CC7F9B1", name: "Hair Braids" },
          { id: "DB81767B-2083-4C66-8E8D-1A0D897ABA7C", name: "Synthetic Wigs" },
        ],
      },
      {
        id: "CE5FADBB-B432-40B9-8B20-200F6928762A",
        name: "Beauty Tools",
        leaves: [
          { id: "2502140311201613700", name: "Mirrors" },
          { id: "47D355FB-E6C1-4E0B-AE31-0B1696A4B68E", name: "Straightening Irons" },
          { id: "6D086E0D-8C3F-4B99-BA44-140F3F7C444E", name: "Electric Face Cleanser" },
          { id: "AB11F624-D292-4A8E-9284-BD368B893A2C", name: "Face Skin Care Tools" },
          { id: "C75F27EE-695C-423E-BCB4-7CFE67221332", name: "Curling Iron" },
          { id: "D23FFB85-4185-4FA3-BAF0-224A4F516741", name: "Facial Steamer" },
        ],
      },
    ],
  },
  {
    id: "2837816E-2FEA-4455-845C-6F40C6D70D1E",
    name: "Jewelry & Watches",
    seconds: [
      {
        id: "01114D8D-79BD-4AD9-85A0-72D1B050E3F8",
        name: "Wedding & Engagement",
        leaves: [
          { id: "04B879BE-79E7-4CB9-B493-B03F628B5130", name: "Bridal Jewelry Sets" },
          { id: "443467E0-29C5-4850-9BF4-B0D8F9008EEB", name: "Wedding Hair Jewelry" },
          { id: "FCE034F6-A2BF-47E3-852F-FA9F67F904B2", name: "Engagement Rings" },
          { id: "FCF87613-7AF4-4053-B688-B415FDD242CE", name: "Wedding & Engagement" },
        ],
      },
      {
        id: "123ACC01-7A11-4FB9-A532-338C0E7C04C5",
        name: "Fashion Jewelry",
        leaves: [
          { id: "0615F8DB-C10F-4BEF-892B-1C5B04268938", name: "Bracelets & Bangles" },
          { id: "1363024200339689472", name: "Brooches" },
          { id: "1363289906151034880", name: "Keychains" },
          { id: "2601070547231620800", name: "Pocket Watches" },
          { id: "2601070548141611900", name: "Anklets" },
          { id: "2909669F-96C4-457A-A425-19799F2A47BF", name: "Charms" },
          { id: "56B4F8B6-8600-4A18-913E-53F2F693EC2C", name: "Rings" },
          { id: "633E1860-7C63-4006-AB35-3FC16BECFA62", name: "Body Jewelry" },
          { id: "89D165E3-EF5F-461D-9DC9-D1041CECEF09", name: "Fashion Jewelry Sets" },
          { id: "95D9F317-1DB3-4E42-A031-02223215B9C5", name: "Necklace & Pendants" },
          { id: "B5525066-3504-4E5C-962F-9C2D8C38F66D", name: "Men's Cuff Links" },
          { id: "D28405AE-66C6-42E6-BFF0-D6FDCB5C083C", name: "Earrings" },
        ],
      },
      {
        id: "3E53507E-2EDB-49F1-8D0D-AD01225DAD8A",
        name: "Fine Jewelry",
        leaves: [
          { id: "391F1C45-D86B-4A92-893E-48C1CA84C461", name: "Various Gemstones" },
          { id: "552F095A-904C-40E4-A43B-0CD1CE15D29F", name: "925 Silver Jewelry" },
          { id: "7BCF191E-A4CC-403E-AF46-81370EB3AB19", name: "K-Gold" },
          { id: "84ED4B7F-D7C3-412F-AF18-04F25C91985C", name: "Pearls Jewelry" },
          { id: "D7CE9827-F50A-4B07-84BF-1BFE44188A1C", name: "Fine Earrings" },
          { id: "E403FB8A-B59A-4A81-B776-EBF3343FE3E3", name: "Men's Fine Jewelry" },
          { id: "E8B256EF-44F0-4FA0-847B-F104FD29E101", name: "Fine Jewelry Sets" },
        ],
      },
      {
        id: "603B4E08-4226-4BFC-A46E-FCCE92ED1C63",
        name: "Men's Watches",
        leaves: [
          { id: "1987B0AD-8C6A-4D02-B5B2-5D94E83B069F", name: "Quartz Watches" },
          { id: "369EB061-A5CD-4F1F-A105-6DAB1D520F49", name: "Mechanical Watches" },
          { id: "3D882765-B20E-4EFD-BFCC-136942A83C4C", name: "Digital Watches" },
          { id: "76B0FCF7-2571-4B64-AE23-82D6A15C4C19", name: "Dual Display Watches" },
          { id: "BF68CA3E-F698-475E-A1AD-C8E4C44D7C8D", name: "Men Sports Watches" },
        ],
      },
      {
        id: "F1B0B876-9103-4DF0-9EA5-524094648BFD",
        name: "Women's Watches",
        leaves: [
          { id: "2601070548491632400", name: "Watch Accessories" },
          { id: "9D78B3E3-99F4-4EDA-8C70-2F5B95061CAA", name: "Women Sports Watches" },
          { id: "A044AC0D-BA3B-4967-8300-1BD57F00048E", name: "Dress Watches" },
          { id: "DAE17D16-A15F-445D-AE34-B698F3290E56", name: "Creative Watches" },
          { id: "DC682F4C-BD7E-4DB0-93CB-33B4CD54BE87", name: "Lovers' Watches" },
          { id: "F40CB152-1391-4CA9-9BAE-0316DA2D3D2B", name: "Women's Bracelet Watches" },
          { id: "FBD85934-5409-4EC6-A6B5-FDBF072AA0E2", name: "Children's Watches" },
        ],
      },
    ],
  },
  {
    id: "B8302697-CF47-4211-9BD0-DFE8995AEB30",
    name: "Men's Clothing",
    seconds: [
      {
        id: "20DA7E59-3A12-40DE-B8B6-78AD03A61DB1",
        name: "Underwear & Loungewear",
        leaves: [
          { id: "0222F963-84BC-4ED8-87A0-2EE6B7890B53", name: "Men's Sleep & Lounge" },
          { id: "12A1288F-063D-427F-BF07-10F53784849B", name: "Shorts" },
          { id: "1A3AF8F0-0549-4529-873A-5D109B301643", name: "Briefs" },
          { id: "60A76402-BF69-49A3-8FEC-28B9235BED62", name: "Robes" },
          { id: "A6A734F9-6F0B-4A9F-9ED4-0D35A9F5B877", name: "Man Pajama Sets" },
          { id: "AEEDE316-97ED-442D-AE77-3A444B1AF073", name: "Boxers" },
          { id: "E7F165D8-BBE8-4AE3-87E8-999864158243", name: "Long Johns" },
        ],
      },
      {
        id: "609C16BC-2A1E-4FE5-9A07-7D7E36EA24F5",
        name: "Outerwear & Jackets",
        leaves: [
          { id: "007F26BA-B50A-4ADA-BD36-2CD341411230", name: "Suits & Blazer" },
          { id: "1357252400104214528", name: "Men's Sweaters" },
          { id: "1ED06BF8-F5D4-45E5-A95F-D7FC278C7EF3", name: "Genuine Leather" },
          { id: "222439DF-4ED5-4DCF-BB22-8FB41607C7D2", name: "Man Trench" },
          { id: "2409230540121629100", name: "Men's Shirts" },
          { id: "2409230540351618000", name: "Men's Jackets" },
          { id: "2502140305411618900", name: "Men's Suits" },
          { id: "976399B4-534B-46F0-B18A-62075824A717", name: "Man Hoodies & Sweatshirts" },
          { id: "CD1AEB49-F87A-42D2-AD82-77708A8CDFD7", name: "Wool & Blends" },
          { id: "E6E0E866-DB80-4EC9-9557-578320427C34", name: "Parkas" },
          { id: "F7CF2C2C-A7F5-488B-B457-646028917DF2", name: "Down Jackets" },
        ],
      },
      {
        id: "90619059-822F-469F-9231-D58761546093",
        name: "Accessories",
        leaves: [
          { id: "1C592A63-6E0F-4F25-9496-8BDD82BF4281", name: "Socks" },
          { id: "2410301013241608600", name: "Men's Ties" },
          { id: "37F32196-21BB-49CE-B2D4-80787A5DF276", name: "Scarves" },
          { id: "44A3ADE0-A8EC-4101-A8DE-DF42F56EF3F1", name: "Man Gloves & Mittens" },
          { id: "C0EFBA18-A36D-48CD-B953-85DDFCB9B1C6", name: "Skullies & Beanies" },
          { id: "ECF5842F-2FE6-4DD7-8827-FAA8A1D3D199", name: "Belts" },
          { id: "EF619898-429D-49B6-BD66-49057C06259B", name: "Man Prescription Glasses" },
        ],
      },
      {
        id: "ACCD31BE-6CFB-40DB-AB0D-FD5FAA14153A",
        name: "Bottoms",
        leaves: [
          { id: "758FE9DE-16D9-4860-8472-46C5BA460FF7", name: "Pajama Sets" },
          { id: "7D830BF3-03DB-4EBB-8A50-ED5F1231E17A", name: "Man Shorts" },
          { id: "846D76D8-095D-4DD8-89DF-1E48D869F60C", name: "Cargo Pants" },
          { id: "911754C0-443D-4ECF-9083-DF04C907BD81", name: "Man Jeans" },
          { id: "B97A0CAD-6160-485B-A3FD-04EE4493A442", name: "Harem Pants" },
          { id: "C992BFAB-12A9-4C61-A1DA-6E09C926BB81", name: "Casual Pants" },
          { id: "D75F1892-F6F8-4295-966B-CB405B77070A", name: "Sweatpants" },
        ],
      },
      {
        id: "C118B8EA-D1AF-4C66-AA8A-FCCC28B8C073",
        name: "T-Shirts",
        leaves: [
          { id: "05B15AC3-931A-4A72-9F1D-DC54CBCA51C4", name: "Geometric" },
          { id: "2502140308291606200", name: "Men's Long-Sleeved" },
          { id: "521887E1-D6D5-4475-81B7-63B9F72DDFCA", name: "Striped" },
          { id: "655B8008-6BB9-4AA1-8025-6206ACFF018A", name: "Solid" },
          { id: "9E77F21D-54E4-41B5-BB97-2CECBEA9DA96", name: "3D" },
          { id: "BE11EEDB-B765-4A39-8A3D-F6015FC7A846", name: "Print" },
        ],
      },
      {
        id: "DC3A5713-984B-4877-95C4-8400B7151AF8",
        name: "Hats & Caps",
        leaves: [
          { id: "0203EC28-49AF-49E4-B899-333C0A235BD4", name: "Baseball Caps" },
          { id: "243C5278-C220-4110-B2AF-129118F09171", name: "Bomber Hats" },
          { id: "3F464061-C4C7-43FE-A3FE-84AD92838E56", name: "Berets" },
          { id: "EB891BA4-6F5C-4625-B76A-49504556B127", name: "Fedoras" },
        ],
      },
    ],
  },
  {
    id: "2415A90C-5D7B-4CC7-BA8C-C0949F9FF5D8",
    name: "Bags & Shoes",
    seconds: [
      {
        id: "D82A6AF3-78F1-4A33-8F44-A37F282B2209",
        name: "Men's Luggage & Bags",
        leaves: [
          { id: "9F5FDE97-3BE8-4EBE-A8EA-48723A307E37", name: "Briefcases" },
          { id: "B701FAC3-80F0-43B1-9EA5-2C05C55F582A", name: "Waist Bags" },
          { id: "C50C5B6E-1517-4CBE-97FE-ECC923C83D35", name: "Girls Bags" },
          { id: "CDCCB9B1-D5DD-4C20-AF32-101FE427B63C", name: "Men's Backpacks" },
          { id: "E89AC661-0B9E-4967-A0A3-7B0C6DEDDC7D", name: "Luggage & Travel Bags" },
          { id: "EA292A58-E696-428B-8BEB-DE105690DDB3", name: "Crossbody Bags" },
          { id: "F3F4B418-17DF-49A1-AD76-A436B7618FFC", name: "Man Wallets" },
        ],
      },
      {
        id: "E93B19EF-4E2C-4526-B2DF-BBFB6F2A80A7",
        name: "Women's Shoes",
        leaves: [
          { id: "1988B912-7A18-4ED2-B1E1-61ED290A0E82", name: "Woman Boots" },
          { id: "1B559D30-B370-4C8E-8CFD-1E1BC47E217F", name: "Vulcanize Shoes" },
          { id: "2502190401571622500", name: "Women's Insoles" },
          { id: "638284D0-3651-4FC9-9F25-B0A0BA323D83", name: "Pumps" },
          { id: "8F756420-4840-474E-B2D6-6725ED219970", name: "Woman Slippers" },
          { id: "AAB54987-4E92-40C7-B0F5-5E814C1E6980", name: "Woman Sandals" },
          { id: "F35FC838-1CFE-49D1-A8CA-CF7401F9C444", name: "Flats" },
        ],
      },
      {
        id: "EC2E9303-E704-43F3-834A-A15EA653232E",
        name: "Women's Luggage & Bags",
        leaves: [
          { id: "0ADE366E-CDF4-47E7-8720-B480220E1BD4", name: "Woman Wallets" },
          { id: "2410301013451614000", name: "Women's Crossbody Bags" },
          { id: "2502190501141602700", name: "Bag Accessories" },
          { id: "33AFFE07-CC46-4557-9FD9-27CC9975BEED", name: "Evening Bags" },
          { id: "78BCE010-8E22-416F-82E2-6E5C6AE0CECE", name: "Fashion Backpacks" },
          { id: "7DC7FA45-C8E1-4A2E-BA84-B81FB9CA2815", name: "Shoulder Bags" },
          { id: "8F3ADC01-68FE-4CBE-BB1D-0DE42A730749", name: "Totes" },
          { id: "96C833A9-93EC-4D76-B093-3A3B945659C6", name: "Boys Bags" },
          { id: "CB7C7348-41DC-4AA5-9BD0-CC2D555899BB", name: "Clutches" },
        ],
      },
      {
        id: "FE8AD446-B2BF-4C8C-B90B-49A6F2B3FF6A",
        name: "Men's Shoes",
        leaves: [
          { id: "0F0296D6-F057-4FD4-9E06-95D5DBCCE6EB", name: "Man Boots" },
          { id: "11C9DE73-0438-40E2-80B8-72697795C9F2", name: "Formal Shoes" },
          { id: "2502190401401619600", name: "Men's Insoles" },
          { id: "312428E8-5075-4F74-A317-8EB051C0C068", name: "Man Slippers" },
          { id: "B8640E7B-F07D-4C0F-A5CF-8ACC533DA86F", name: "Vulcanize Shoe" },
          { id: "D0E37ED0-65C8-43E3-8B84-C973040DCE9C", name: "Man Sandals" },
          { id: "F419006D-AE55-4691-93FC-52FEBB459DBA", name: "Casual Shoes" },
        ],
      },
    ],
  },
  {
    id: "A50A92FA-BCB3-4716-9BD9-BEC629BEE735",
    name: "Toys, Kids & Babies",
    seconds: [
      {
        id: "04D68B68-1048-4971-BAFA-18FA0A6DB95C",
        name: "Toys & Hobbies",
        leaves: [
          { id: "6614840A-DB50-4FBB-80FD-705F4FD59BFA", name: "Electronic Pets" },
          { id: "835F7743-8432-4D0F-90F0-E76C89F7C5B7", name: "Blocks" },
          { id: "AEABDF3C-35E9-4BDA-8F5B-DA602BC5B9C8", name: "RC Helicopters" },
          { id: "DD918287-C279-466A-B9C6-56079DE4B37A", name: "Stuffed & Plush Animals" },
          { id: "F18491A9-2F33-4D85-A154-78EE4CD2AD33", name: "Action & Toy Figures" },
        ],
      },
      {
        id: "0F88CF9B-C46C-491B-8933-115806ED8A13",
        name: "Shoes & Bags",
        leaves: [
          { id: "2502190154341624400", name: "Children's Shoes" },
          { id: "5AF1783E-547C-44E5-AD8A-82B354860BCB", name: "Boys Shoes" },
          { id: "62A4235C-31EE-40E3-9D61-8F310470FEBC", name: "School Bags" },
          { id: "929F5F58-AFBB-43AE-B1BB-CC6AA3844530", name: "Kids Wallets" },
          { id: "C6FBABFE-2E34-4BD8-B643-C3060E9D343B", name: "Girls Shoes" },
          { id: "C7FEF0C8-C59D-44DC-9715-7C377441ECFE", name: "Baby's First Walkers" },
        ],
      },
      {
        id: "54251EAE-F02B-4B6B-93D7-DE2BB387F60B",
        name: "Boys Clothing",
        leaves: [
          { id: "7BF9295D-69A0-483C-871C-9E3AF2A3496C", name: "Boy Jeans" },
          { id: "8DA1BB63-9FC2-4817-9271-3474CDBDDB30", name: "Boy T-Shirts" },
          { id: "BB0B0BAD-326B-4328-B1BF-319C420DF782", name: "Boy Hoodies & Sweatshirts" },
          { id: "BE16F1EB-5C31-4A1E-B80F-F1905F046E7F", name: "Outerwear & Coats" },
          { id: "C938C806-CB88-46AB-B782-89ECD0B25E25", name: "Boy Clothing Sets" },
          { id: "D91A4505-6495-4DFD-9984-C8E728913127", name: "Boy Accessories" },
        ],
      },
      {
        id: "7A31FADF-137D-4C83-AD7B-BCF28CACDA94",
        name: "Baby Clothing",
        leaves: [
          { id: "04D82B39-7CF8-4CA5-ABC9-279181DE7E26", name: "Baby Clothing Sets" },
          { id: "80304DEB-99FB-4E29-9065-A99F732702C4", name: "Baby Rompers" },
          { id: "8F8C7970-3965-4EB6-8E13-ED77EB686DBA", name: "Baby Accessories" },
          { id: "A91DDCDF-A80E-40EE-ADB6-C3CB20CCB07E", name: "Baby Outerwear" },
          { id: "B34957D5-3AF6-4BE7-AC9F-72BAB8433CB6", name: "Baby Dresses" },
          { id: "B81FEFAC-C995-4665-8154-631E447F7236", name: "Baby Pants" },
        ],
      },
      {
        id: "8C946349-0DC4-4B1E-AC41-E4FE30288DEE",
        name: "Baby & Mother",
        leaves: [
          { id: "0B08F5C8-0381-446D-A1C0-B90F69F45041", name: "Nappy Changing" },
          { id: "4065FFF7-4AAA-4CFA-B04B-639C93624469", name: "Activity & Gear" },
          { id: "5C374126-AE88-4617-B732-011174077E00", name: "Backpacks & Carriers" },
          { id: "77A1D79C-B67E-42C0-850F-00005042548C", name: "Baby Care" },
          { id: "CBAB567C-28EA-4916-97C9-786EEA80A3B8", name: "Maternity" },
        ],
      },
      {
        id: "BE42B051-DE15-444A-97FA-79580E6AEC78",
        name: "Girls Clothing",
        leaves: [
          { id: "1357514957859721216", name: "Girls Underwear" },
          { id: "2601070549181635500", name: "Girls' Pants" },
          { id: "5795C34B-0DF0-4838-A78C-C125AA3BED18", name: "Family Matching Outfits" },
          { id: "5CC68C6B-8D69-41B2-838A-A98CB7DDD744", name: "Sleepwear & Robes" },
          { id: "6ED3E32C-89DD-4DD1-A991-FEAA4F3C1BFD", name: "Tops & Tees" },
          { id: "713CBA54-B38E-4C86-9323-1252113E437F", name: "Girl Clothing Sets" },
          { id: "88856603-65DA-419C-8C64-4C1E91A9E983", name: "Girl Accessories" },
          { id: "C421D769-76CC-4515-909E-4E7167EE6ABE", name: "Girl Dresses" },
        ],
      },
    ],
  },
  {
    id: "4B397425-26C1-4D0E-B6D2-96B0B03689DB",
    name: "Sports & Outdoors",
    seconds: [
      {
        id: "1E2633D4-2F96-4E2A-ABF7-BCBF3DFEE28A",
        name: "Sneakers",
        leaves: [
          { id: "24A29AC9-8B9B-4552-AF5E-431E6CF47C67", name: "Running Shoes" },
          { id: "3928EB2C-04C4-4862-BCBD-A4987005A629", name: "Dance Shoes" },
          { id: "4B83DB4C-2D1F-4FA4-8844-FC39C6DBD60B", name: "Skateboarding Shoes" },
          { id: "5F140735-E3D7-46A0-A28D-34607B05B720", name: "Hiking Shoes" },
          { id: "9DA4624F-A8A2-4DC1-9088-81877A4944F2", name: "Soccer Shoes" },
          { id: "C8FD79F7-DF24-495F-BE12-5F8585A8E5ED", name: "Basketball Shoes" },
        ],
      },
      {
        id: "36492F79-E7EB-42F0-8DCC-6129BD9D2AE1",
        name: "Other Sports Equipment",
        leaves: [
          { id: "02FB2558-F014-4E0A-A2FE-30BE514A2B01", name: "Musical Instruments" },
          { id: "2D818FE8-522E-4102-B659-F807564251ED", name: "Hunting" },
          { id: "8B8C7FFB-6686-4994-B6DB-E5B8C1AAC9A6", name: "Skiing & Snowboarding" },
          { id: "C20B25A2-348C-48C8-A2C8-FE33749A40DE", name: "Fitness & Bodybuilding" },
          { id: "EA851596-F20F-4AA5-8869-4BB5CA1968DC", name: "Camping & Hiking" },
          { id: "FD5E95E1-C8DC-4CBD-A203-8BCF3BA951B9", name: "Golf" },
        ],
      },
      {
        id: "4B36F14A-6894-4047-8845-56CAFCF9A914",
        name: "Swimming",
        leaves: [
          { id: "0653C2F4-A393-4BD1-B903-7B0569960868", name: "One-Piece Suits" },
          { id: "56F1151E-2544-4044-BB41-03081A532B2F", name: "Bikini Sets" },
          { id: "5E554D7C-64F3-4457-82AA-B0483EED26FB", name: "Two-Piece Suits" },
          { id: "76C86F19-2411-450E-8F69-DDE1DC6580E9", name: "Men's Swimwear" },
          { id: "7B7C97C3-34E3-4DC6-A639-FB7FA421E146", name: "Cover-Ups" },
          { id: "9CFD57D3-3BEB-498F-85F1-C752C4937D75", name: "Children's Swimwear" },
        ],
      },
      {
        id: "55A1D05D-A254-4242-A4BD-4BE88F0680B6",
        name: "Cycling",
        leaves: [
          { id: "161FA128-487C-4451-8B49-CB81B5A30A54", name: "Bicycle Lights" },
          { id: "2410301013021610400", name: "Scooters" },
          { id: "2502140309251616200", name: "Cycling Gloves" },
          { id: "3D0169CF-0F24-4EEA-948E-E48C3980862E", name: "Bicycle Helmets" },
          { id: "7992143D-A8B2-4A05-A4E4-7F4AF73AA577", name: "Cycling Eyewear" },
          { id: "A0A24BC7-F4F4-4090-9D83-6ECA1F4A78FD", name: "Bicycle Frames" },
          { id: "BE08AC4E-D953-413F-93FC-452F635E73EC", name: "Cycling Jerseys" },
          { id: "FF18DE9F-3D6A-48A0-A246-EF5B1D0D4E0E", name: "Bicycles" },
        ],
      },
      {
        id: "66C86053-159B-436E-B4A9-4A7CCB5CAC8A",
        name: "Sportswear",
        leaves: [
          { id: "5A053E55-5D18-42EF-A4E7-B08AEA4D9B2F", name: "Jerseys" },
          { id: "79F47CD1-F813-4B4D-8D21-2B35966FBA66", name: "Sports Accessories" },
          { id: "8E8CE199-A134-45B1-9EDE-0D4F122F4568", name: "Outdoor Shorts" },
          { id: "937A06CE-ECCC-4C7D-A270-B216DE612AC0", name: "Sports Bags" },
          { id: "AB04A021-C988-476D-88E7-3CAAE3019D9E", name: "Hiking Jackets" },
          { id: "FE1DB733-120C-4506-B990-107EAC5E62E5", name: "Pants" },
        ],
      },
      {
        id: "CD4184EB-CD02-4789-8CFA-8FF3B4DEFC4E",
        name: "Fishing",
        leaves: [
          { id: "11E0FCD6-AD17-4F72-B5FF-8F8C79F85CE5", name: "Fishing Reels" },
          { id: "1210D5B0-E172-47F8-8ADA-E3280624F5A5", name: "Rod Combos" },
          { id: "37C76B77-3E08-456A-B184-4516E7D6EE81", name: "Fishing Tackle Boxes" },
          { id: "9704D88F-46A0-49F6-98C4-929AE91941F5", name: "Fishing Lures" },
          { id: "B27D0790-81A0-484A-9D92-0AFBA04FDA31", name: "Fishing Rods" },
          { id: "E2019E0B-EDC1-4B90-8C65-EE6A87AF7E73", name: "Fishing Lines" },
        ],
      },
    ],
  },
  {
    id: "D9E66BF8-4E81-4CAB-A425-AEDEC5FBFBF2",
    name: "Consumer Electronics",
    seconds: [
      {
        id: "30063684-45E2-4929-BB85-441C1DF80DDE",
        name: "Accessories & Parts",
        leaves: [
          { id: "40CC2ED1-8998-4515-9139-787CC25D42A7", name: "Digital Cables" },
          { id: "599DFE31-C6AD-42D2-93AA-762126BBA475", name: "Home Electronic Accessories" },
          { id: "66D0D817-353B-492E-87A5-024091FF9000", name: "Audio & Video Cables" },
          { id: "6DB79FAF-593D-4F52-B6FF-AB1D14331862", name: "Charger" },
          { id: "A0D39205-3770-4F0B-91BD-65E711263577", name: "Batteries" },
          { id: "AD2B299F-EC10-4209-998A-8916AE4D4900", name: "Digital Gear Bags" },
        ],
      },
      {
        id: "4BFAF763-DD09-4DD3-A7E9-E03724D1D51B",
        name: "Home Audio & Video",
        leaves: [
          { id: "0AC6B44A-12CC-456F-831F-54064C77D303", name: "Projectors" },
          { id: "0F932A8E-47CB-4CB6-B7C3-C4D9F7CF62EC", name: "Television" },
          { id: "3A557A5A-FDAF-48BF-A989-3ED90B9ED228", name: "TV Receivers" },
          { id: "872FA218-4F48-4F03-8FEE-ADE7CF21BC45", name: "Audio Amplifiers" },
          { id: "A9B643D0-7AA9-4703-A59B-D01C4526CDF9", name: "Projectors & Acessories" },
          { id: "D6C23AAE-B8EE-481C-9B61-34557971D45F", name: "Home Audio & Video" },
          { id: "D8515A8C-ECAC-422B-9963-14D7B07E10DB", name: "TV Sticks" },
        ],
      },
      {
        id: "6A03FBB1-F7D9-441F-B06D-EF45CA87B553",
        name: "Smart Electronics",
        leaves: [
          { id: "11D33F89-9B90-4D1A-B977-DE229BAA7E86", name: "Wearable Devices" },
          { id: "36F73513-6A5A-445D-87F9-BF3D6629E649", name: "Smart Home Appliances" },
          { id: "4336FAFE-B9C9-4673-8706-BCFAE1448DA2", name: "Smart Wearable Accessories" },
          { id: "895CF515-0F6B-481D-8A32-604EDCBEFBED", name: "Smart Wristbands" },
          { id: "C83EF2A0-8FA3-4713-9901-2FD6E4554D97", name: "Smart Watches" },
          { id: "E95322D2-FF23-4837-A0C0-0CA686B9F062", name: "Smart Remote Controls" },
        ],
      },
      {
        id: "85E0D3B7-C3C4-4F1B-98A6-958389A1BEBE",
        name: "Camera & Photo",
        leaves: [
          { id: "11D96803-A0A3-4175-B49B-2102EC285965", name: "Photo Studio" },
          { id: "907BBB40-C131-4D3C-BA05-794D47EEBC90", name: "Camera Drones" },
          { id: "A2B55BEF-9B7D-44A0-8E80-A14FFFBBBD94", name: "Camera & Photo Accessories" },
          { id: "AA40156F-A334-475E-9CA0-7E5520645980", name: "Digital Cameras" },
          { id: "AD21D6F7-42CB-44E7-89B2-542692C7D101", name: "Action Cameras" },
          { id: "DE5A9724-8B92-404F-B15E-1FCAD6594BAF", name: "Camcorders" },
        ],
      },
    ],
  },
];

// ─── Build lookup maps ────────────────────────────────────────────────────────

/** Leaf categoryId → { category: firstLevelName, subcategory: secondLevelName } */
const byLeafId = new Map<string, { category: string; subcategory: string }>();

/** Leaf categoryName (lowercase) → { category, subcategory } */
const byLeafName = new Map<string, { category: string; subcategory: string }>();

/** Second-level categorySecondId → { category, subcategory } (fallback) */
const bySecondId = new Map<string, { category: string; subcategory: string }>();

/** First-level categoryFirstId → { category, subcategory } (last-resort fallback) */
const byFirstId = new Map<string, { category: string; subcategory: string }>();

for (const first of CJ_TREE) {
  const category = first.name;
  byFirstId.set(first.id, { category, subcategory: "" });

  for (const second of first.seconds) {
    const subcategory = second.name;
    const entry = { category, subcategory };
    bySecondId.set(second.id, entry);

    for (const leaf of second.leaves) {
      byLeafId.set(leaf.id, entry);
      byLeafName.set(leaf.name.toLowerCase(), entry);
    }
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Resolve a CJ categoryId (any level) to the NEXA { category, subcategory } pair.
 * - Level 3 (leaf)  → category = categoryFirstName, subcategory = categorySecondName
 * - Level 2         → category = categoryFirstName, subcategory = categorySecondName
 * - Level 1         → category = categoryFirstName, subcategory = ""
 * - Not found       → { category: "Other", subcategory: "" }
 */
export function getCategoryById(
  id: string | null | undefined,
): { category: string; subcategory: string } {
  if (!id) return { category: "Other", subcategory: "" };
  return (
    byLeafId.get(id) ??
    bySecondId.get(id) ??
    byFirstId.get(id) ??
    { category: "Other", subcategory: "" }
  );
}

/**
 * Resolve a CJ leaf categoryName to { category, subcategory }.
 * Case-insensitive match. Falls back to { category: name, subcategory: "" } if
 * the name is not found in the tree (keeps it visible in the UI).
 */
export function getCategoryByName(
  name: string | null | undefined,
): { category: string; subcategory: string } {
  if (!name) return { category: "Other", subcategory: "" };
  return byLeafName.get(name.toLowerCase()) ?? { category: name, subcategory: "" };
}

/**
 * Full CJ category tree as a flat array of top-level categories with their
 * subcategories (second-level names). Useful for static UI trees.
 */
export const CJ_CATEGORY_TREE: Array<{ name: string; subcategories: string[] }> =
  CJ_TREE.map((first) => ({
    name: first.name,
    subcategories: first.seconds.map((s) => s.name),
  }));
