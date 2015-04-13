var utils = {};

utils.rand = function rand(min, max) { return Math.floor(Math.random() * (max - min)) + min; };

utils.padLeft = function(pad, str) { return (pad + str).slice(-pad.length); };

utils.formatDate = function(d) {

	if (!(d instanceof Date)) return '';

	return d.getFullYear()+'-'+this.padLeft('00', (d.getMonth()+1))+'-'+this.padLeft('00', d.getDate())

};

utils.generateRandomUserData = function() {

	var fnames = ['Bruce','Alfred Jodokus','Muumi','I am','Donatello','Jacob', 'Mason', 'William', 'Jayden', 'Noah', 'Michael', 'Ethan', 'Alexander', 'Aiden', 'Daniel', 'Anthony', 'Matthew', 'Elijah', 'Joshua', 'Liam', 'Andrew', 'James', 'David', 'Benjamin', 'Logan', 'Christopher', 'Joseph', 'Jackson', 'Gabriel', 'Ryan', 'Samuel', 'John', 'Nathan', 'Lucas', 'Christian', 'Jonathan', 'Caleb', 'Dylan', 'Landon', 'Isaac', 'Gavin', 'Brayden', 'Tyler', 'Luke', 'Evan', 'Carter', 'Nicholas', 'Isaiah', 'Owen', 'Jack', 'Jordan', 'Brandon', 'Wyatt', 'Julian', 'Aaron', 'Sophia', 'Isabella', 'Emma', 'Olivia', 'Ava', 'Emily', 'Abigail', 'Madison', 'Mia', 'Chloe', 'Elizabeth', 'Ella', 'Addison', 'Natalie', 'Lily', 'Grace', 'Samantha', 'Avery', 'Sofia', 'Aubrey', 'Brooklyn', 'Lillian', 'Victoria', 'Evelyn', 'Hannah', 'Alexis', 'Charlotte', 'Zoey', 'Leah', 'Amelia', 'Zoe', 'Hailey', 'Layla', 'Gabriella', 'Nevaeh', 'Kaylee', 'Alyssa', 'Anna', 'Sarah', 'Allison', 'Savannah', 'Ashley', 'Audrey', 'Taylor', 'Brianna', 'Aaliyah', 'Riley', 'Camila', 'Khloe', 'Claire'],
		lnames = ['Wayne','Kwak', 'Peikko','Batman','of TMNT', 'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Miller', 'Davis', 'Garcia', 'Rodriguez', 'Wilson'],
		//npatterns = ['%s.%s', '%1s.%s', '%s-%s', '%s%s%d', '%s_%s'],
		domains = ['gmail.com', 'hotmail.com', 'suomi24.fi', 'artic.net'];

	var email, fname, lname, pass;
	fname = fnames[this.rand(0,fnames.length-1)].toLowerCase();
	lname = lnames[this.rand(0,lnames.length-1)].toLowerCase();

	switch(this.rand(0,2)) {
		case 0: email = fname+'.'+lname; break;
		case 1: email = fname.substr(0,1)+lname; break;
		case 2: email = fname+'_'+lname; break;
	}

	email = email.replace(/[^a-z0-9\._]/g, '.')+'@'+domains[this.rand(0,domains.length-1)];
	pass = this.generateRandomPassword();

	return {email:email,password:pass};

};

utils.generateRandomPassword = function() {

	var rnd = (+new Date*Math.random()*10000).toString(36).substring(0,10);//console.log(rnd);

	for(var i = 0; i < 5; i++) {
		switch(this.rand(0,9)) {
			case 0: rnd = rnd.replace('a', '@'); break;
			case 1: rnd = rnd.replace('s', '$'); break;
			case 2: rnd = rnd.replace('i', '!'); break;
			case 3: rnd = rnd.replace('e', '&'); break;
			case 4: rnd = rnd.replace('h', '#'); break;
			case 5: rnd = rnd.replace('q', '?'); break;
			default: var at = this.rand(0,rnd.length-1); rnd = rnd.substring(0,at)+rnd.charAt(at).toUpperCase()+rnd.substring(at+1); break;
		}
	}

	return rnd;

};

utils.generateRandomBoard = function(userIDs){


  var possibleNames = ['lankku', 'board', 'lauta', 'asdasd', 'muumimaa', 'pokemonit', 'oma', 'testi', 'projekti', 'scrum', 'gamejam', 'derp', 'häksiboksi', 'koodit', 'joulu', 'jeee'];

  var boardName = possibleNames[this.rand(0, possibleNames.length-1)] + this.rand(0, 999);
  var boardAuthor = userIDs[this.rand(0, userIDs.length-1)];

  return {name:boardName, createdBy:boardAuthor};

};

utils.generateRandomTicket = function(boardIDs){


  var heading = "heading";
  var content = "niin paljon tekstiä";

  var boardID = boardIDs[this.rand(0, boardIDs.length-1)];

  return {heading:heading, content:content, board:boardID};

}

module.exports = utils;