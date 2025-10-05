function cde(type, properties, children)
{
    var el;
    var className;
    var id;
    
    if (type) {
        type = type.replace(/[.#][^.#]+/g, function (match)
        {
            if (match[0] === ".") {
                className = match.substr(1);
            } else {
                id = match.substr(1);
            }
            return "";
        });
    }
    if (type) {
        el = document.createElement(type);
        
        if (className) {
            el.classList.add.apply(el.classList, className.split(" "));
        }
        if (id) {
            el.id = id;
        }
    } else {
        el = document.createDocumentFragment();
    }
    
    /// Make properties optional.
    if (!children && Array.isArray(properties)) {
        children = properties;
        properties = undefined;
    }
    
    if (properties && !Array.isArray(properties)) {
        Object.keys(properties).forEach(function (prop)
        {
            var propName = prop;
            
            /// If the property starts with "on", it's an event.
            if (prop.startsWith("on")) {
                el.addEventListener(prop.substring(2), properties[prop]);
            } else {
                if (prop === "class") {
                    propName = "className";
                } else if (prop === "t") {
                    propName = "textContent";
                }
                
                try {
                    if (propName === "style") {
                        Object.keys(properties[prop]).forEach(function (key)
                        {
                            el.style.setProperty(key, properties[prop][key]);
                        });
                    } else if (propName === "className" && typeof properties[prop] === "string") {
                        el.classList.add.apply(el.classList, properties[prop].split(" "));
                    } else if (typeof el[propName] === "undefined") {
                        el.setAttribute(propName, properties[prop]);
                    } else {
                        try {
                            el[propName] = properties[prop];
                        } catch (e) {
                            try {
                                el.setAttribute(propName, properties[prop]);
                            } catch (e) {
                                console.error(e);
                            }
                        }
                    }
                } catch (e) {
                    /// Sometimes Safari would through errors.
                    console.error(e, prop);
                }
            }
        });
    }
    
    if (Array.isArray(children)) {
        children.forEach(function (child)
        {
            if (child) {
                if (typeof child === "object") {
                    el.appendChild(child);
                } else {
                    el.appendChild(document.createTextNode(child));
                }
            }
        });
    }
    
    return el;
}
var lastCut = 0;
var gameModes = {
    "Learn": learnPlay
};
var settings = {cutoff: 1};
var page = document.getElementById("page");
var questionSets;
var sets = [{name: "CRs", data: [{"q":"Genesis 9:8–11","a":"(8) And God spake unto Noah, and to his sons with him, saying, (9) And I, behold, I establish my covenant with you, and with your seed after you; (10) And with every living creature that is with you, of the fowl, of the cattle, and of every beast of the earth with you; from all that go out of the ark, to every beast of the earth. (11) And I will establish my covenant with you; neither shall all flesh be cut off any more by the waters of a flood; neither shall there any more be a flood to destroy the earth."},{"q":"Genesis 12:1–3","a":"(1) Now the Lord had said unto Abram, Get thee out of thy country, and from thy kindred, and from thy father’s house, unto a land that I will shew thee: (2) And I will make of thee a great nation, and I will bless thee, and make thy name great; and thou shalt be a blessing: (3) And I will bless them that bless thee, and curse him that curseth thee: and in thee shall all families of the earth be blessed."},{"q":"Genesis 28:1–4","a":"(1) And Isaac called Jacob, and blessed him, and charged him, and said unto him, Thou shalt not take a wife of the daughters of Canaan. (2) Arise, go to Padan-aram, to the house of Bethuel thy mother’s father; and take thee a wife from thence of the daughters of Laban thy mother’s brother. (3) And God Almighty bless thee, and make thee fruitful, and multiply thee, that thou mayest be a multitude of people; (4) And give thee the blessing of Abraham, to thee, and to thy seed with thee; that thou mayest inherit the land wherein thou art a stranger, which God gave unto Abraham."},{"q":"Genesis 32:28","a":"(28) And he said, Thy name shall be called no more Jacob, but Israel: for as a prince hast thou power with God and with men, and hast prevailed."},{"q":"Genesis 35:11–12","a":"(11) And God said unto him, I am God Almighty: be fruitful and multiply; a nation and a company of nations shall be of thee, and kings shall come out of thy loins; (12) And the land which I gave Abraham and Isaac, to thee I will give it, and to thy seed after thee will I give the land."},{"q":"Genesis 48:3–4","a":"(3) And Jacob said unto Joseph, God Almighty appeared unto me at Luz in the land of Canaan, and blessed me, (4) And said unto me, Behold, I will make thee fruitful, and multiply thee, and I will make of thee a multitude of people; and will give this land to thy seed after thee for an everlasting possession."},{"q":"Exodus 6:3","a":"(3) And I appeared unto Abraham, unto Isaac, and unto Jacob, by the name of God Almighty, but by my name JEHOVAH was I not known to them."},{"q":"Exodus 12:1–14","a":"(1) And the Lord spake unto Moses and Aaron in the land of Egypt, saying, (2) This month shall be unto you the beginning of months: it shall be the first month of the year to you. (3) Speak ye unto all the congregation of Israel, saying, In the tenth day of this month they shall take to them every man a lamb, according to the house of their fathers, a lamb for an house: (4) And if the household be too little for the lamb, let him and his neighbour next unto his house take it according to the number of the souls; every man according to his eating shall make your count for the lamb. (5) Your lamb shall be without blemish, a male of the first year: ye shall take it out from the sheep, or from the goats: (6) And ye shall keep it up until the fourteenth day of the same month: and the whole assembly of the congregation of Israel shall kill it in the evening. (7) And they shall take of the blood, and strike it on the two side posts and on the upper door post of the houses, wherein they shall eat it. (8) And they shall eat the flesh in that night, roast with fire, and unleavened bread; and with bitter herbs they shall eat it. (9) Eat not of it raw, nor sodden at all with water, but roast with fire; his head with his legs, and with the purtenance thereof. (10) And ye shall let nothing of it remain until the morning; and that which remaineth of it until the morning ye shall burn with fire. (11) And thus shall ye eat it; with your loins girded, your shoes on your feet, and your staff in your hand; and ye shall eat it in haste: it is the Lord’s passover. (12) For I will pass through the land of Egypt this night, and will smite all the firstborn in the land of Egypt, both man and beast; and against all the gods of Egypt I will execute judgment: I am the Lord. (13) And the blood shall be to you for a token upon the houses where ye are: and when I see the blood, I will pass over you, and the plague shall not be upon you to destroy you, when I smite the land of Egypt. (14) And this day shall be unto you for a memorial; and ye shall keep it a feast to the Lord throughout your generations; ye shall keep it a feast by an ordinance for ever."},{"q":"Exodus 15:18","a":"(18) The Lord shall reign for ever and ever."},{"q":"Exodus 19:3–6","a":"(3) And Moses went up unto God, and the Lord called unto him out of the mountain, saying, Thus shalt thou say to the house of Jacob, and tell the children of Israel; (4) Ye have seen what I did unto the Egyptians, and how I bare you on eagles’ wings, and brought you unto myself. (5) Now therefore, if ye will obey my voice indeed, and keep my covenant, then ye shall be a peculiar treasure unto me above all people: for all the earth is mine: (6) And ye shall be unto me a kingdom of priests, and an holy nation. These are the words which thou shalt speak unto the children of Israel."},{"q":"Exodus 20:8–11","a":"(8) Remember the sabbath day, to keep it holy. (9) Six days shalt thou labour, and do all thy work: (10) But the seventh day is the sabbath of the Lord thy God: in it thou shalt not do any work, thou, nor thy son, nor thy daughter, thy manservant, nor thy maidservant, nor thy cattle, nor thy stranger that is within thy gates: (11) For in six days the Lord made heaven and earth, the sea, and all that in them is, and rested the seventh day: wherefore the Lord blessed the sabbath day, and hallowed it."},{"q":"Exodus 31:16–18","a":"(16) Wherefore the children of Israel shall keep the sabbath, to observe the sabbath throughout their generations, for a perpetual covenant. (17) It is a sign between me and the children of Israel for ever: for in six days the Lord made heaven and earth, and on the seventh day he rested, and was refreshed. (18) And he gave unto Moses, when he had made an end of communing with him upon mount Sinai, two tables of testimony, tables of stone, written with the finger of God."},{"q":"Leviticus 20:7–8","a":"(7) Sanctify yourselves therefore, and be ye holy: for I am the Lord your God. (8) And ye shall keep my statutes, and do them: I am the Lord which sanctify you."},{"q":"Deuteronomy 25:4","a":"(4) Thou shalt not muzzle the ox when he treadeth out the corn."},{"q":"1 Samuel 7:3","a":"(3) And Samuel spake unto all the house of Israel, saying, If ye do return unto the Lord with all your hearts, then put away the strange gods and Ashtaroth from among you, and prepare your hearts unto the Lord, and serve him only: and he will deliver you out of the hand of the Philistines."},{"q":"1 Chronicles 16:23–24","a":"(23) Sing unto the Lord, all the earth; shew forth from day to day his salvation. (24) Declare his glory among the heathen; his marvellous works among all nations."},{"q":"Job 33:4","a":"(4) The Spirit of God hath made me, and the breath of the Almighty hath given me life."},{"q":"Psalm 19:1","a":"(1) The heavens declare the glory of God; and the firmament sheweth his handywork."},{"q":"Psalm 86:10–12","a":"(10) For thou art great, and doest wondrous things: thou art God alone. (11) Teach me thy way, O Lord; I will walk in thy truth: unite my heart to fear thy name. (12) I will praise thee, O Lord my God, with all my heart: and I will glorify thy name for evermore."},{"q":"Psalm 95:6","a":"(6) O come, let us worship and bow down: let us kneel before the Lord our maker."},{"q":"Psalm 104:1–2","a":"(1) Bless the Lord, O my soul. O Lord my God, thou art very great; thou art clothed with honour and majesty. (2) Who coverest thyself with light as with a garment: who stretchest out the heavens like a curtain:"},{"q":"Psalm 104:30","a":"(30) Thou sendest forth thy spirit, they are created: and thou renewest the face of the earth."},{"q":"Psalm 127:3","a":"(3) Lo, children are an heritage of the Lord: and the fruit of the womb is his reward."},{"q":"Psalm 145:17","a":"(17) The Lord is righteous in all his ways, and holy in all his works."},{"q":"Proverbs 12:10","a":"(10) A righteous man regardeth the life of his beast: but the tender mercies of the wicked are cruel."},{"q":"Proverbs 14:12","a":"(12) There is a way which seemeth right unto a man, but the end thereof are the ways of death."},{"q":"Isaiah 7:14","a":"(14) Therefore the Lord himself shall give you a sign; Behold, a virgin shall conceive, and bear a son, and shall call his name Immanuel."},{"q":"Isaiah 53:5","a":"(5) But he was wounded for our transgressions, he was bruised for our iniquities: the chastisement of our peace was upon him; and with his stripes we are healed."},{"q":"Isaiah 58:13","a":"(13) If thou turn away thy foot from the sabbath, from doing thy pleasure on my holy day; and call the sabbath a delight, the holy of the Lord, honourable; and shalt honour him, not doing thine own ways, nor finding thine own pleasure, nor speaking thine own words:"},{"q":"Isaiah 64:6","a":"(6) But we are all as an unclean thing, and all our righteousnesses are as filthy rags; and we all do fade as a leaf; and our iniquities, like the wind, have taken us away."},{"q":"Isaiah 64:8","a":"(8) But now, O Lord, thou art our father; we are the clay, and thou our potter; and we all are the work of thy hand."},{"q":"Jeremiah 31:31–33","a":"(31) Behold, the days come, saith the Lord, that I will make a new covenant with the house of Israel, and with the house of Judah: (32) Not according to the covenant that I made with their fathers in the day that I took them by the hand to bring them out of the land of Egypt; which my covenant they brake, although I was an husband unto them, saith the Lord: (33) But this shall be the covenant that I will make with the house of Israel; After those days, saith the Lord, I will put my law in their inward parts, and write it in their hearts; and will be their God, and they shall be my people."},{"q":"Micah 5:2","a":"(2) But thou, Bethlehem Ephratah, though thou be little among the thousands of Judah, yet out of thee shall he come forth unto me that is to be ruler in Israel; whose goings forth have been from of old, from everlasting."},{"q":"Habakkuk 3:1–2","a":"(1) A prayer of Habakkuk the prophet upon Shigionoth. (2) O Lord, I have heard thy speech, and was afraid: O Lord, revive thy work in the midst of the years, in the midst of the years make known; in wrath remember mercy."},{"q":"Malachi 2:10","a":"(10) Have we not all one father? hath not one God created us? why do we deal treacherously every man against his brother, by profaning the covenant of our fathers?"},{"q":"Malachi 2:15–16","a":"(15) And did not he make one? Yet had he the residue of the spirit. And wherefore one? That he might seek a godly seed. Therefore take heed to your spirit, and let none deal treacherously against the wife of his youth. (16) For the Lord, the God of Israel, saith that he hateth putting away: for one covereth violence with his garment, saith the Lord of hosts: therefore take heed to your spirit, that ye deal not treacherously."},{"q":"Matthew 1:23","a":"(23) Behold, a virgin shall be with child, and shall bring forth a son, and they shall call his name Emmanuel, which being interpreted is, God with us."},{"q":"Matthew 2:1","a":"(1) Now when Jesus was born in Bethlehem of Judaea in the days of Herod the king, behold, there came wise men from the east to Jerusalem,"},{"q":"Matthew 4:10","a":"(10) Then saith Jesus unto him, Get thee hence, Satan: for it is written, Thou shalt worship the Lord thy God, and him only shalt thou serve."},{"q":"Matthew 5:7","a":"(7) Blessed are the merciful: for they shall obtain mercy."},{"q":"Matthew 6:26","a":"(26) Behold the fowls of the air: for they sow not, neither do they reap, nor gather into barns; yet your heavenly Father feedeth them. Are ye not much better than they?"},{"q":"Matthew 11:28–29","a":"(28) Come unto me, all ye that labour and are heavy laden, and I will give you rest. (29) Take my yoke upon you, and learn of me; for I am meek and lowly in heart: and ye shall find rest unto your souls."},{"q":"Matthew 19:3–9","a":"(3) The Pharisees also came unto him, tempting him, and saying unto him, Is it lawful for a man to put away his wife for every cause? (4) And he answered and said unto them, Have ye not read, that he which made them at the beginning made them male and female, (5) And said, For this cause shall a man leave father and mother, and shall cleave to his wife: and they twain shall be one flesh? (6) Wherefore they are no more twain, but one flesh. What therefore God hath joined together, let not man put asunder. (7) They say unto him, Why did Moses then command to give a writing of divorcement, and to put her away? (8) He saith unto them, Moses because of the hardness of your hearts suffered you to put away your wives: but from the beginning it was not so. (9) And I say unto you, Whosoever shall put away his wife, except it be for fornication, and shall marry another, committeth adultery: and whoso marrieth her which is put away doth commit adultery."},{"q":"Matthew 26:2","a":"(2) Ye know that after two days is the feast of the passover, and the Son of man is betrayed to be crucified."},{"q":"Matthew 26:41","a":"(41) Watch and pray, that ye enter not into temptation: the spirit indeed is willing, but the flesh is weak."},{"q":"Matthew 28:19–20","a":"(19) Go ye therefore, and teach all nations, baptizing them in the name of the Father, and of the Son, and of the Holy Ghost: (20) Teaching them to observe all things whatsoever I have commanded you: and, lo, I am with you alway, even unto the end of the world. Amen."},{"q":"Mark 10:4–6","a":"(4) And they said, Moses suffered to write a bill of divorcement, and to put her away. (5) And Jesus answered and said unto them, For the hardness of your heart he wrote you this precept. (6) But from the beginning of the creation God made them male and female."},{"q":"Mark 15:15","a":"(15) And so Pilate, willing to content the people, released Barabbas unto them, and delivered Jesus, when he had scourged him, to be crucified."},{"q":"Luke 1:32","a":"(32) He shall be great, and shall be called the Son of the Highest: and the Lord God shall give unto him the throne of his father David:"},{"q":"Luke 1:50","a":"(50) And his mercy is on them that fear him from generation to generation."},{"q":"Luke 6:36","a":"(36) Be ye therefore merciful, as your Father also is merciful."},{"q":"Luke 16:13","a":"(13) No servant can serve two masters: for either he will hate the one, and love the other; or else he will hold to the one, and despise the other. Ye cannot serve God and mammon."},{"q":"Luke 22:20","a":"(20) Likewise also the cup after supper, saying, This cup is the new testament in my blood, which is shed for you."},{"q":"John 1:4–5","a":"(4) In him was life; and the life was the light of men. (5) And the light shineth in darkness; and the darkness comprehended it not."},{"q":"John 1:14","a":"(14) And the Word was made flesh, and dwelt among us, (and we beheld his glory, the glory as of the only begotten of the Father,) full of grace and truth."},{"q":"John 1:17","a":"(17) For the law was given by Moses, but grace and truth came by Jesus Christ."},{"q":"John 3:36","a":"(36) He that believeth on the Son hath everlasting life: and he that believeth not the Son shall not see life; but the wrath of God abideth on him."},{"q":"John 14:1–3","a":"(1) Let not your heart be troubled: ye believe in God, believe also in me. (2) In my Father’s house are many mansions: if it were not so, I would have told you. I go to prepare a place for you. (3) And if I go and prepare a place for you, I will come again, and receive you unto myself; that where I am, there ye may be also."},{"q":"John 14:26","a":"(26) But the Comforter, which is the Holy Ghost, whom the Father will send in my name, he shall teach you all things, and bring all things to your remembrance, whatsoever I have said unto you."},{"q":"John 17:17","a":"(17) Sanctify them through thy truth: thy word is truth."},{"q":"John 17:24","a":"(24) Father, I will that they also, whom thou hast given me, be with me where I am; that they may behold my glory, which thou hast given me: for thou lovedst me before the foundation of the world."},{"q":"Acts 2:32","a":"(32) This Jesus hath God raised up, whereof we all are witnesses."},{"q":"Romans 1:16","a":"(16) For I am not ashamed of the gospel of Christ: for it is the power of God unto salvation to every one that believeth; to the Jew first, and also to the Greek."},{"q":"Romans 3:10–12","a":"(10) As it is written, There is none righteous, no, not one: (11) There is none that understandeth, there is none that seeketh after God. (12) They are all gone out of the way, they are together become unprofitable; there is none that doeth good, no, not one."},{"q":"Romans 8:35–39","a":"(35) Who shall separate us from the love of Christ? shall tribulation, or distress, or persecution, or famine, or nakedness, or peril, or sword? (36) As it is written, For thy sake we are killed all the day long; we are accounted as sheep for the slaughter. (37) Nay, in all these things we are more than conquerors through him that loved us. (38) For I am persuaded, that neither death, nor life, nor angels, nor principalities, nor powers, nor things present, nor things to come, (39) Nor height, nor depth, nor any other creature, shall be able to separate us from the love of God, which is in Christ Jesus our Lord."},{"q":"Romans 16:25–26","a":"(25) Now to him that is of power to stablish you according to my gospel, and the preaching of Jesus Christ, according to the revelation of the mystery, which was kept secret since the world began, (26) But now is made manifest, and by the scriptures of the prophets, according to the commandment of the everlasting God, made known to all nations for the obedience of faith:"},{"q":"1 Corinthians 1:2","a":"(2) Unto the church of God which is at Corinth, to them that are sanctified in Christ Jesus, called to be saints, with all that in every place call upon the name of Jesus Christ our Lord, both theirs and ours:"},{"q":"1 Corinthians 5:7","a":"(7) Purge out therefore the old leaven, that ye may be a new lump, as ye are unleavened. For even Christ our passover is sacrificed for us:"},{"q":"1 Corinthians 11:3","a":"(3) But I would have you know, that the head of every man is Christ; and the head of the woman is the man; and the head of Christ is God."},{"q":"1 Corinthians 11:7–9","a":"(7) For a man indeed ought not to cover his head, forasmuch as he is the image and glory of God: but the woman is the glory of the man. (8) For the man is not of the woman; but the woman of the man. (9) Neither was the man created for the woman; but the woman for the man."},{"q":"1 Corinthians 15:38–39","a":"(38) But God giveth it a body as it hath pleased him, and to every seed his own body. (39) All flesh is not the same flesh: but there is one kind of flesh of men, another flesh of beasts, another of fishes, and another of birds."},{"q":"2 Corinthians 5:6–8","a":"(6) Therefore we are always confident, knowing that, whilst we are at home in the body, we are absent from the Lord: (7) (For we walk by faith, not by sight:) (8) We are confident, I say, and willing rather to be absent from the body, and to be present with the Lord."},{"q":"Galatians 4:4–5","a":"(4) But when the fulness of the time was come, God sent forth his Son, made of a woman, made under the law, (5) To redeem them that were under the law, that we might receive the adoption of sons."},{"q":"Ephesians 1:3–14","a":"(3) Blessed be the God and Father of our Lord Jesus Christ, who hath blessed us with all spiritual blessings in heavenly places in Christ: (4) According as he hath chosen us in him before the foundation of the world, that we should be holy and without blame before him in love: (5) Having predestinated us unto the adoption of children by Jesus Christ to himself, according to the good pleasure of his will, (6) To the praise of the glory of his grace, wherein he hath made us accepted in the beloved. (7) In whom we have redemption through his blood, the forgiveness of sins, according to the riches of his grace; (8) Wherein he hath abounded toward us in all wisdom and prudence; (9) Having made known unto us the mystery of his will, according to his good pleasure which he hath purposed in himself: (10) That in the dispensation of the fulness of times he might gather together in one all things in Christ, both which are in heaven, and which are on earth; even in him: (11) In whom also we have obtained an inheritance, being predestinated according to the purpose of him who worketh all things after the counsel of his own will: (12) That we should be to the praise of his glory, who first trusted in Christ. (13) In whom ye also trusted, after that ye heard the word of truth, the gospel of your salvation: in whom also after that ye believed, ye were sealed with that holy Spirit of promise, (14) Which is the earnest of our inheritance until the redemption of the purchased possession, unto the praise of his glory."},{"q":"Ephesians 2:19–22","a":"(19) Now therefore ye are no more strangers and foreigners, but fellowcitizens with the saints, and of the household of God; (20) And are built upon the foundation of the apostles and prophets, Jesus Christ himself being the chief corner stone; (21) In whom all the building fitly framed together groweth unto an holy temple in the Lord: (22) In whom ye also are builded together for an habitation of God through the Spirit."},{"q":"Ephesians 4:11–12","a":"(11) And he gave some, apostles; and some, prophets; and some, evangelists; and some, pastors and teachers; (12) For the perfecting of the saints, for the work of the ministry, for the edifying of the body of Christ:"},{"q":"Ephesians 4:32","a":"(32) And be ye kind one to another, tenderhearted, forgiving one another, even as God for Christ’s sake hath forgiven you."},{"q":"Ephesians 5:22–33","a":"(22) Wives, submit yourselves unto your own husbands, as unto the Lord. (23) For the husband is the head of the wife, even as Christ is the head of the church: and he is the saviour of the body. (24) Therefore as the church is subject unto Christ, so let the wives be to their own husbands in every thing. (25) Husbands, love your wives, even as Christ also loved the church, and gave himself for it; (26) That he might sanctify and cleanse it with the washing of water by the word, (27) That he might present it to himself a glorious church, not having spot, or wrinkle, or any such thing; but that it should be holy and without blemish. (28) So ought men to love their wives as their own bodies. He that loveth his wife loveth himself. (29) For no man ever yet hated his own flesh; but nourisheth and cherisheth it, even as the Lord the church: (30) For we are members of his body, of his flesh, and of his bones. (31) For this cause shall a man leave his father and mother, and shall be joined unto his wife, and they two shall be one flesh. (32) This is a great mystery: but I speak concerning Christ and the church. (33) Nevertheless let every one of you in particular so love his wife even as himself; and the wife see that she reverence her husband."},{"q":"Philippians 3:20–21","a":"(20) For our conversation is in heaven; from whence also we look for the Saviour, the Lord Jesus Christ: (21) Who shall change our vile body, that it may be fashioned like unto his glorious body, according to the working whereby he is able even to subdue all things unto himself."},{"q":"Colossians 1:13–16","a":"(13) Who hath delivered us from the power of darkness, and hath translated us into the kingdom of his dear Son: (14) In whom we have redemption through his blood, even the forgiveness of sins: (15) Who is the image of the invisible God, the firstborn of every creature: (16) For by him were all things created, that are in heaven, and that are in earth, visible and invisible, whether they be thrones, or dominions, or principalities, or powers: all things were created by him, and for him:"},{"q":"Colossians 2:16–17","a":"(16) Let no man therefore judge you in meat, or in drink, or in respect of an holyday, or of the new moon, or of the sabbath days: (17) Which are a shadow of things to come; but the body is of Christ."},{"q":"Colossians 3:15","a":"(15) And let the peace of God rule in your hearts, to the which also ye are called in one body; and be ye thankful."},{"q":"1 Thessalonians 1:10","a":"(10) And to wait for his Son from heaven, whom he raised from the dead, even Jesus, which delivered us from the wrath to come."},{"q":"2 Thessalonians 1:7–8","a":"(7) And to you who are troubled rest with us, when the Lord Jesus shall be revealed from heaven with his mighty angels, (8) In flaming fire taking vengeance on them that know not God, and that obey not the gospel of our Lord Jesus Christ:"},{"q":"1 Timothy 3:15","a":"(15) But if I tarry long, that thou mayest know how thou oughtest to behave thyself in the house of God, which is the church of the living God, the pillar and ground of the truth."},{"q":"1 Timothy 4:4","a":"(4) For every creature of God is good, and nothing to be refused, if it be received with thanksgiving:"},{"q":"2 Timothy 3:16","a":"(16) All scripture is given by inspiration of God, and is profitable for doctrine, for reproof, for correction, for instruction in righteousness:"},{"q":"Titus 3:1–8","a":"(1) Put them in mind to be subject to principalities and powers, to obey magistrates, to be ready to every good work, (2) To speak evil of no man, to be no brawlers, but gentle, shewing all meekness unto all men. (3) For we ourselves also were sometimes foolish, disobedient, deceived, serving divers lusts and pleasures, living in malice and envy, hateful, and hating one another. (4) But after that the kindness and love of God our Saviour toward man appeared, (5) Not by works of righteousness which we have done, but according to his mercy he saved us, by the washing of regeneration, and renewing of the Holy Ghost; (6) Which he shed on us abundantly through Jesus Christ our Saviour; (7) That being justified by his grace, we should be made heirs according to the hope of eternal life. (8) This is a faithful saying, and these things I will that thou affirm constantly, that they which have believed in God might be careful to maintain good works. These things are good and profitable unto men."},{"q":"Hebrews 1:1–3","a":"(1) God, who at sundry times and in divers manners spake in time past unto the fathers by the prophets, (2) Hath in these last days spoken unto us by his Son, whom he hath appointed heir of all things, by whom also he made the worlds; (3) Who being the brightness of his glory, and the express image of his person, and upholding all things by the word of his power, when he had by himself purged our sins, sat down on the right hand of the Majesty on high;"},{"q":"Hebrews 2:1","a":"(1) Therefore we ought to give the more earnest heed to the things which we have heard, lest at any time we should let them slip."},{"q":"Hebrews 3:12","a":"(12) Take heed, brethren, lest there be in any of you an evil heart of unbelief, in departing from the living God."},{"q":"Hebrews 3:15","a":"(15) While it is said, To day if ye will hear his voice, harden not your hearts, as in the provocation."},{"q":"Hebrews 4:11","a":"(11) Let us labour therefore to enter into that rest, lest any man fall after the same example of unbelief."},{"q":"Hebrews 4:14–15","a":"(14) Seeing then that we have a great high priest, that is passed into the heavens, Jesus the Son of God, let us hold fast our profession. (15) For we have not an high priest which cannot be touched with the feeling of our infirmities; but was in all points tempted like as we are, yet without sin."},{"q":"Hebrews 9:15","a":"(15) And for this cause he is the mediator of the new testament, that by means of death, for the redemption of the transgressions that were under the first testament, they which are called might receive the promise of eternal inheritance."},{"q":"Hebrews 9:22","a":"(22) And almost all things are by the law purged with blood; and without shedding of blood is no remission."},{"q":"Hebrews 11:1–6","a":"(1) Now faith is the substance of things hoped for, the evidence of things not seen. (2) For by it the elders obtained a good report. (3) Through faith we understand that the worlds were framed by the word of God, so that things which are seen were not made of things which do appear. (4) By faith Abel offered unto God a more excellent sacrifice than Cain, by which he obtained witness that he was righteous, God testifying of his gifts: and by it he being dead yet speaketh. (5) By faith Enoch was translated that he should not see death; and was not found, because God had translated him: for before his translation he had this testimony, that he pleased God. (6) But without faith it is impossible to please him: for he that cometh to God must believe that he is, and that he is a rewarder of them that diligently seek him."},{"q":"James 1:13–15","a":"(13) Let no man say when he is tempted, I am tempted of God: for God cannot be tempted with evil, neither tempteth he any man: (14) But every man is tempted, when he is drawn away of his own lust, and enticed. (15) Then when lust hath conceived, it bringeth forth sin: and sin, when it is finished, bringeth forth death."},{"q":"James 2:13","a":"(13) For he shall have judgment without mercy, that hath shewed no mercy; and mercy rejoiceth against judgment."},{"q":"1 Peter 1:15–16","a":"(15) But as he which hath called you is holy, so be ye holy in all manner of conversation; (16) Because it is written, Be ye holy; for I am holy."},{"q":"1 Peter 1:18–19","a":"(18) Forasmuch as ye know that ye were not redeemed with corruptible things, as silver and gold, from your vain conversation received by tradition from your fathers; (19) But with the precious blood of Christ, as of a lamb without blemish and without spot:"},{"q":"1 Peter 2:24","a":"(24) Who his own self bare our sins in his own body on the tree, that we, being dead to sins, should live unto righteousness: by whose stripes ye were healed."},{"q":"1 Peter 3:1–2","a":"(1) Likewise, ye wives, be in subjection to your own husbands; that, if any obey not the word, they also may without the word be won by the conversation of the wives; (2) While they behold your chaste conversation coupled with fear."},{"q":"1 Peter 3:7","a":"(7) Likewise, ye husbands, dwell with them according to knowledge, giving honour unto the wife, as unto the weaker vessel, and as being heirs together of the grace of life; that your prayers be not hindered."},{"q":"1 Peter 3:9","a":"(9) Not rendering evil for evil, or railing for railing: but contrariwise blessing; knowing that ye are thereunto called, that ye should inherit a blessing."},{"q":"2 Peter 2:9","a":"(9) The Lord knoweth how to deliver the godly out of temptations, and to reserve the unjust unto the day of judgment to be punished:"},{"q":"1 John 1:5","a":"(5) This then is the message which we have heard of him, and declare unto you, that God is light, and in him is no darkness at all."},{"q":"1 John 2:14","a":"(14) I have written unto you, fathers, because ye have known him that is from the beginning. I have written unto you, young men, because ye are strong, and the word of God abideth in you, and ye have overcome the wicked one."},{"q":"1 John 3:10–12","a":"(10) In this the children of God are manifest, and the children of the devil: whosoever doeth not righteousness is not of God, neither he that loveth not his brother. (11) For this is the message that ye heard from the beginning, that we should love one another. (12) Not as Cain, who was of that wicked one, and slew his brother. And wherefore slew he him? Because his own works were evil, and his brother’s righteous."},{"q":"1 John 4:10","a":"(10) Herein is love, not that we loved God, but that he loved us, and sent his Son to be the propitiation for our sins."},{"q":"1 John 4:19","a":"(19) We love him, because he first loved us."},{"q":"Revelation 4:8","a":"(8) And the four beasts had each of them six wings about him; and they were full of eyes within: and they rest not day and night, saying, Holy, holy, holy, Lord God Almighty, which was, and is, and is to come."},{"q":"Revelation 4:11","a":"(11) Thou art worthy, O Lord, to receive glory and honour and power: for thou hast created all things, and for thy pleasure they are and were created."},{"q":"Revelation 5:8–10","a":"(8) And when he had taken the book, the four beasts and four and twenty elders fell down before the Lamb, having every one of them harps, and golden vials full of odours, which are the prayers of saints. (9) And they sung a new song, saying, Thou art worthy to take the book, and to open the seals thereof: for thou wast slain, and hast redeemed us to God by thy blood out of every kindred, and tongue, and people, and nation; (10) And hast made us unto our God kings and priests: and we shall reign on the earth."},{"q":"Revelation 14:12–13","a":"(12) Here is the patience of the saints: here are they that keep the commandments of God, and the faith of Jesus. (13) And I heard a voice from heaven saying unto me, Write, Blessed are the dead which die in the Lord from henceforth: Yea, saith the Spirit, that they may rest from their labours; and their works do follow them."},{"q":"Revelation 17:14","a":"(14) These shall make war with the Lamb, and the Lamb shall overcome them: for he is Lord of lords, and King of kings: and they that are with him are called, and chosen, and faithful."},{"q":"Revelation 19:11","a":"(11) And I saw heaven opened, and behold a white horse; and he that sat upon him was called Faithful and True, and in righteousness he doth judge and make war."},{"q":"Revelation 21:1–4","a":"(1) And I saw a new heaven and a new earth: for the first heaven and the first earth were passed away; and there was no more sea. (2) And I John saw the holy city, new Jerusalem, coming down from God out of heaven, prepared as a bride adorned for her husband. (3) And I heard a great voice out of heaven saying, Behold, the tabernacle of God is with men, and he will dwell with them, and they shall be his people, and God himself shall be with them, and be their God. (4) And God shall wipe away all tears from their eyes; and there shall be no more death, neither sorrow, nor crying, neither shall there be any more pain: for the former things are passed away."},{"q":"Revelation 22:5","a":"(5) And there shall be no night there; and they need no candle, neither light of the sun; for the Lord God giveth them light: and they shall reign for ever and ever."}]}];
function loadFilesFromSetsFolder() {
    var filesObject = {};
    var filesIndex = 0;
    var fileNames = ["cats", "churches", "crs-ai", "crs-me", "fp-chapter-content", "general", "isaiah60", "place-names", "rapid-fire", "titles", "whereis"]; // Replace with actual file names
    
    function loadNextFile() {
        if (filesIndex >= fileNames.length) {
            console.log("All files loaded:", filesObject);
            questionSets = filesObject;
            Object.keys(questionSets).forEach(function(key) {
                var op = document.createElement("option");
                op.textContent = key;
                setSelect.appendChild(op);
            });
            return;
        }

        var filePath = "sets/" + fileNames[filesIndex];
        var xhr = new XMLHttpRequest();
        
        xhr.open("GET", filePath, true);
        xhr.onreadystatechange = function() {
            if (xhr.readyState === 4) {
                if (xhr.status === 200) {
                    filesObject[fileNames[filesIndex]] = xhr.responseText;
                } else {
                    console.error("Failed to load file: " + filePath);
                }
                filesIndex++;
                loadNextFile();
            }
        };
        xhr.send();
    }
    loadNextFile();
}
var modes = [
    "Learn",
    "Multiple Choice",
    "Buzzer",
    // "Rapid Rush"
];
function read() {
    if(readIndex >= curQuestion.q.length) {
        clearInterval(readInt);
        return;
    }
    header.textContent += curQuestion.q[readIndex++];
}
function buzz() {
    if(mode === "read") {
        if(fallibleJudge && !fallibleTimeout) {
            var fallibleTimeout = setTimeout(buzzIn, fallibleWait);
        } else {
            buzzIn();
        }
    } else if(mode === "think") {
        showAns();
    } else if(mode === "y/n") {
        correct();
    }
}
function handlePaste(e) {
    text = e.clipboardData.getData("text/plain").trim();
    parseSet(text);
}
function parseSet(text) {
    if(text[0] === "[") {
        var newSet = JSON.parse(text);
        activeSet = splitJSON(newSet);
        scores = [];
        startGame();
        return;
    }
    text = text.replace(/\t/gi, "|");
    text = text.replace(/\[/gi,"");
    text = text.replace(/\]/gi,"");

    text = text.split("\n");
    if(text[0].indexOf("|") > -1) {
        activeSet = split(text);
        scores = [];
        return true;
    } else {
        alert("Could not parse");
        console.log(text);
        return false;
    }
}
function split(arr) {
    var set = [];
    for(var i = 0; i < arr.length; i++) {
        if(arr[i].indexOf("|") < 1) {
            continue;
        }
        var cur = arr[i].split("|");
        if(settings.reverse) {
            set.push({q: cur[1], a: cur[0]});
        } else {
            set.push({q: cur[0], a: cur[1]});
        }
    }
    return set;
}
function splitJSON(arr) {
    var set = [];
    for(var i = 0; i < arr.length; i++) {
        if(settings.reverse) {
            set.push({q: arr[i][1], a: arr[i][0]});
        } else {
            set.push({q: arr[i][0], a: arr[i][1]});
        }
    }
    return set;
}
function shuffle(arr, from, to)
{
    var i,
        rand,
        tmp;
    
    if (!arr) {
        return;
    }
    
    if (typeof from === "undefined") {
        from = 0;
    }
    
    if (typeof to === "undefined") {
        to = arr.length - 1;
    }
    
    for (i = from; i < to; i += 1) {
        rand = Math.floor(Math.random() * (to - from + 1)) + from;
        if (rand !== i) {
            tmp = arr[i];
            arr[i] = arr[rand];
            arr[rand] = tmp;
        }
    }
}
function generateChoices(arr, count, ans) {
    var choices = [];
    while(choices.length + 1 < count) {
        var cur = randArr(arr);
        if(cur.a !== ans && !choices.includes(cur.a)) {
            choices.push(cur.a);
        }
    }
    var ansI = Math.floor(count*Math.random());
    choices.splice(ansI, 0, ans);
    return {choices: choices, ansI: ansI};
}
function bindToObj(element, obj, key) {
    var tag = element.tagName.toLowerCase();
    var type = element.type;

    // Helper to check if a value is numeric
    function isNumeric(val) {
        // Exclude empty strings and null/undefined
        return val !== '' && !isNaN(val) && !isNaN(parseFloat(val));
    }

    // Helper to get the current value based on element type
    function getElementValue() {
        if (type === 'checkbox') {
            return element.checked;
        } else if (tag === 'select') {
            return convertValue(element.value);
        } else {
            return convertValue(element.value);
        }
    }

    // Helper to set the element's value based on object
    function setElementValue(val) {
        if (type === 'checkbox') {
            element.checked = !!val;
        } else if (tag === 'select') {
            element.value = val;
        } else {
            element.value = val;
        }
    }

    // Helper to convert value to number if numeric
    function convertValue(val) {
        return isNumeric(val) ? Number(val) : val;
    }

    // Initialize value
    if (obj.hasOwnProperty(key)) {
        setElementValue(obj[key]);
    } else {
        obj[key] = getElementValue();
    }

    // Listen for changes and update the object's key with converted value
    var eventName = (type === 'checkbox' || tag === 'select') ? 'change' : 'input';
    element.addEventListener(eventName, function() {
        obj[key] = getElementValue();
    });
}
function loadPage() {
    var modeSelect = cde("select");
    for(var i = 0; i < modes.length; i++) {
        modeSelect.appendChild(cde("option", {t: modes[i]}));
    }
    bindToObj(modeSelect, settings, "mode");
    
    var setSelect = cde("select", [
        cde("option", {t: "Paste"}),
    ]);
    for(var i = 0; i < sets.length; i++) {
        setSelect.appendChild(cde("option", {t: sets[i].name}));
    }
    bindToObj(setSelect, settings, "set");

    var cutLen = cde("input", {type: "text", value: 50});
    bindToObj(cutLen, settings, "cut");

    var beginAt = cde("input", {type: "text", value: 0});
    bindToObj(beginAt, settings, "begin");


    var playButton = cde("button", {t: "Play"});
    var settingsEl = cde("div.settingContainer", [
        cde("label", ["Mode: ", modeSelect]),
        cde("label", ["Set: ", setSelect]),
        cde("label", ["Begin at: ", beginAt]),
        cde("label", ["Amount: ", cutLen]),
        playButton
    ]);
    playButton.addEventListener("click", function() {
        settingsEl.remove();
        if(settings.set === "Paste") {
            var notif = cde("p", {t: "Paste to begin..."});
            page.appendChild(notif);
            addEventListener("paste", function(e) {
                notif.remove();
                handlePaste(e);
                if(settings.cut > 0) {
                    activeSet = activeSet.slice(lastCut, settings.cut);
                }
                gameModes[settings.mode]();
            }, {once: true});
        } else {
            activeSet = sets[setSelect.selectedIndex-1].data;
            if(settings.cut > 0) {
                activeSet = activeSet.slice(settings.begin-1, settings.begin-1 + settings.cut);
            }
            gameModes[settings.mode]();
        }
    });
    page.appendChild(settingsEl);
}
function learnPlay() {
    shuffle(activeSet);
    var flashQ = cde("div.flash-card-question");
    var yes = cde("button.flash-btn check", {innerHTML: "&#10003;", onclick: correct});
    var no = cde("button.flash-btn x", {innerHTML: "&#10005;", onclick: incorrect});
    var btnContainer = cde("div.flash-card-buttons", {style: {display: "none"}}, [yes, no]);
    var cardContent = cde("div.flash-card-content", [flashQ])
    var flashCard = cde("div.flash-card", [cardContent]);
    var index = 0;
    var curQuestion = activeSet[index];
    var front = false;
    var correctArr = [];
    var incorrectArr = [];
    var curMode = "study";
    function flipCard() {
        if(curMode === "study") {
            front = !front;
            if(front) {
                flashQ.textContent = curQuestion.q;
            } else {
                flashQ.textContent = curQuestion.a;
                btnContainer.style.display = "flex";
            }
        } else {
            reset();
        }
    }
    function reset() {
        flashCard.textContent = "";
        flashCard.appendChild(cardContent);
        
        activeSet = incorrectArr.slice();
        shuffle(activeSet);
        correctArr = [];
        incorrectArr = [];
        index = -1;
        curMode = "study";
        next();
    }
    flashCard.addEventListener("click", flipCard);
    addEventListener("keydown", function(e){
        if(e.code === "Space") {
            flipCard();
        }
        if(curMode === "study") {
            if(e.code === "KeyY") {
                correct(e);
            } else if(e.code === "KeyN") {
                incorrect(e);
            }
        }
    });
    function correct(e) {
        e.stopPropagation();
        correctArr.push(curQuestion);
        next();
    }
    function next() {
        ++index;
        curQuestion = activeSet[index];
        if(curQuestion) {
            front = false;
            flipCard();
            btnContainer.style.display = "none";   
        } else {
            curMode = "wait";
            flashQ.textContent = "";
            flashCard.appendChild(cde("p", {t: "Accuracy: " + (100*correctArr.length/activeSet.length) + "%"}));
            flashCard.appendChild(cde("p", {t: "Hit Space or click to continue"}));
        }
    }
    function incorrect(e) {
        e.stopPropagation();
        incorrectArr.push(curQuestion);
        next();
    }
    flipCard();
    page.appendChild(flashCard);
    page.appendChild(btnContainer);
}
loadPage();

function randArr(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}