const energyDictionaryEN = {
    "renewable energy": [
        "Renewable energy refers to energy sources that are naturally replenished, such as sunlight, wind, and rain.",
        "It's considered environmentally friendly and sustainable, making it a key part of a greener future."
    ],
    "coal": [
        "Coal is a fossil fuel with a long history in electricity generation and industrial processes.",
        "It's known for its significant energy output but has environmental concerns due to carbon emissions."
    ],
    "nuclear energy": [
        "Nuclear energy is produced from nuclear reactions, typically involving uranium or plutonium.",
        "It's a potent energy source with low carbon emissions and is commonly used in power plants."
    ],
    "energy balance": [
        "The energy balance is the most complete statistical accounting of energy products and their flow in the economy. The energy balance allows users to see the total amount of energy extracted from the environment, traded, transformed and used by end-users. It also allows seeing the relative contribution of each energy carrier (fuel, product). The energy balance allows studying the overall domestic energy market and monitoring impacts of energy policies. The energy balance offers a complete view on the energy situation of a country in a compact format, such as on energy consumption of the whole economy and of individual sectors.",
        "The energy balance presents all statistically significant energy products (fuels) of a country and their production, transformation and consumption by different type of economic actors (industry, transport, etc.). Therefore, an energy balance is the natural starting point to study the energy sector.",
        "In a simplified way, we can say that an energy balance is a matrix, where columns are energy products (fuels) and rows are energy flows (production – transformation – consumption sectors).",
        "In a more complex understanding, as stated in IRES, an energy balance is an accounting framework for the compilation and reconciliation of data on all energy products entering, exiting and used within the national territory of a given country during a reference period."
    ],
    "The use of energy balances": [
        "By presenting all the data for all energy products in a common energy unit, the energy balance allows users to see the total amount of energy extracted from the environment, traded, transformed and used by end-users. It also allows seeing the relative contribution of each different energy carrier (fuel, product). The energy balance allows studying the overall domestic energy market, monitoring impacts of energy policies and assessing some of their impacts. The energy balance offers a complete view on the energy situation of a country in a compact format, for the whole economy and for each individual consumption sector.",
        "More generally, a number of questions can be asked by looking at data in the energy balance. The energy balance can be used as a high-level check on the data quality: the coherence and accuracy of reported energy statistics for individual energy products. Large statistical differences in energy units, apparent energy gains, significant losses in transformation processes, unexplained variations in indicators may all indicate underlying data problems.",
        "Energy balance is also the starting point for the construction of several indicators, such as import dependency. Certain aggregates of energy balance contribute to cross domain indicators, such as energy intensity (energy per GDP)."
    ],
    "european policy decision making": [
        "The European Energy Strategy and Energy Union need to be underpinned by statistical evidence for sound decision making. To this end, energy balances are a key input for the Commission's impact assessments in the area of energy policies.",
        "As energy is vital to many sectors of the economy, energy data are used for other purposes too, notably in transport and climate change.",
        "The European Union's energy policy targets include the need for secure energy supplies, sustainable energy consumption, and lower fossil fuel dependence. Energy balances help assess progress in these areas. They are also a key input for monitoring the energy efficiency target of the Europe 2020 strategy.",
        "Directive 2012/27/EU on energy efficiency and its implementation measures refer to the aggregates of energy balances published by Eurostat. In the context of Eurostat's work on sustainable development indicators, energy balances provide a central contribution to Affordable and clean energy."
    ],
    "methodology assumption": [
        `There is a huge set of methodology assumption that needs to be made when constructing energy balances.`
    ],
    "primary production": [
       "Primary production represents any kind of extraction of energy products from natural sources. It takes place when the natural sources are exploited, for example, extraction of lignite in coal mines or extraction of crude oil. It also includes electricity and heat according to the choice of the primary energy form (electricity generation using hydro, wind, and solar PV).",
       "Transformation of energy from one form to another, such as electricity or heat generation in power plants using natural gas or coke oven coke production in coke ovens, is included in the transformation output (middle block of the energy balance) and not in primary production. Therefore, primary production for all secondary fuels is zero."
     ],
    "imports": [
        `Imports represent all entries into the national territory excluding transit quantities. However, if electricity is transited through a country, the amount is reported as both an import and an export. Data reflect amounts having crossed the national territorial boundaries, whether customs clearance has taken place or not. Quantities of crude oil and products imported under processing agreements (i.e. refining on account) are included. Petroleum products imported directly by the petrochemical industry should be included.`
    ],
    "exports": [
        `Exports represent all exits from the national territory excluding transit quantities. However, if electricity is transited through a country, the amount is reported as both an import and an export. Data reflect amounts having crossed the national territorial boundaries, whether customs clearance has taken place or not. Quantities of crude oil and products exported under processing agreements (i.e. refining on account) are included. Petroleum products exported directly by the petrochemical industry should be included.`
    ],
    "nuclear heat": [
        `The total amount of heat generated by nuclear reactors for the production of electricity or for other useful applications of heat. The heat produced in a reactor as a result of nuclear fission is regarded as primary production of nuclear heat, or in other words nuclear energy. It is the actual heat produced or calculated on the basis of reported gross electricity generation and the thermal efficiency of the nuclear plant. The gross electricity generation is measured at the outlet of the main transformers, i.e. the consumption of electricity in the plant auxiliaries and in transformers is included.`,
        `Fuel code: N900H`
    ],
    "recovered and recycled products": [
        `For coal this includes recovered slurries, middlings and other low-grade coal products, which cannot be classified according to type of coal. This includes coal recovered from waste piles and other waste receptacles.`,
        `For petroleum products, these are finished (petroleum) products which pass a second time through the marketing network, after having been once delivered to final consumers (for example used lubricants which are reprocessed).`
    ],
    "change in stock": [
        `The difference between the opening stock level and closing stock level for stocks held on national territory. Stock changes do not refer to reserves (proven or probable) of not yet extracted products, such as underground deposits of crude oil, natural gas and coal.`,
        `Positive value for stock changes means stock draw (fuel put in stocks in previous years was used during the reference year). Negative value for stock changes means stock build (fuel was put in stocks during the reference year and can be used in future).`,
        `For natural gas, variations of stocks represent also the quantities of gas introduced into and removed from the transportation systems. For natural gas it refers to recoverable natural gas stored in special storage facilities (depleted gas and/or oil field, aquifer, salt cavity, mixed caverns, or other) as well as liquefied natural gas storage. Cushion gas should be excluded.`,
        `For non-blended liquid biofuels, stock changes may include stock changes of liquid biofuels destined to be blended.`
    ],
    "natural gas": [
        `Natural gas comprises gases occurring in underground deposits, whether liquefied or gaseous, consisting mainly of methane, independent from the extraction method (conventional and non-conventional). It includes both ‘non-associated’ gas originating from fields producing hydrocarbons only in gaseous form, and ‘associated’ gas produced in association with crude oil, as well as methane recovered from coal mines (colliery gas) or from coal seams (coal seam gas). Natural gas does not include biogas or manufactured gases. Transfers of these products to the natural gas network are to be reported separately from natural gas. Natural gas includes liquefied natural gas (LNG) and compressed natural gas (CNG).`
     ],
    "electricity": [
        `Electricity refers to the transfer of energy through the physical phenomenon involving electric charges and their effects when at rest and in motion. All electricity that is used, produced and consumed is to be reported, including off-grid and self-consumed.`
     ]
};


const stopwordsEN = [
    "a",
    "an",
    "the",
    "in",
    "to",
    "of",
    "and",
    "on",
    "for",
    "with",
    "by",
    "as",
    "is",
    "was",
    "it",
    "that",
    "which",
    "are",
    "be",
    "or",
    "you",
    "I",
    "we",
    "he",
    "she",
    "they",
    "it's",
    "I'm",
    "we're",
    "you're",
    "he's",
    "she's",
    "they're",
    "I'll",
    "you'll",
    "he'll",
    "she'll",
    "they'll",
    "I'd",
    "you'd",
    "he'd",
    "she'd",
    "they'd",
    "I've",
    "you've",
    "we've",
    "they've",
    "I'd",
    "you'd",
    "he'd",
    "she'd",
    "they'd",
    "I've",
    "you've",
    "we've",
    "they've",
    "can",
    "may",
    "should",
    "would",
    "could",
    "might",
    "must",
    "shall",
    "will",
    "just",
    "can",
    "you",
    "help",
    'me',
    'about',
    "can",
    "need",
    "what",
    "tell",
    "more",
    ","
    // '"'
];

const greetings = ["hi", "hello", "hey", "greetings", "morning", "afternoon", "evening", "howdy", "hi there", "what's up", "good day", "yo", "hiya"];

const synonym = {
    "renewable energy": ["green energy", "clean energy"],
    "nuclear energy": ["nuclear power", "atomic energy", "atomic power"],
}