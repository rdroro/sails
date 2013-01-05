describe('findByLike', function() {

	it('should return the user with the given name', function(done) {
		var part = 'findLike';
		var testName = 'asdgah4 test_findLike asg';

		User.create({ name: testName },function (err) {
			if (err) return done(err);
			User.findLike({name: part},function(err,user) {
				if (err) return done(err); 
				if (!user) return done(new Error('findLike() returned nothing!'));
				if (user.name !== testName) return done(new Error('findLike() returned incorrect user!'));
				done(err);
			});
		});
	});

	it('should return proper user when using string syntax', function(done) {
		var part = 'findLike when using string syntax';
		var testName = 'zzzzz asdgah4 test_ findLike when using string syntax asg';

		User.create({ name: testName },function (err) {
			if (err) return done(err);
			User.findLike(part,function(err,user) {
				if (err) return done(err); 
				if (!user) return done(new Error('findLike() returned nothing!'));
				if (user.name !== testName) return done(new Error('findLike() returned incorrect user!'));
				done(err);
			});
		});
	});
});

describe('findAllLike', function() {

	it('should return the users with the given name', function(done) {
		var part = 'findAllLike';
		var testName = 'zz 340ajsdha test_findAllLike -- aw40gasdha';
		var testName2 = 'zz zzbjfk test_findAllLike2../haer-h';

		User.createEach([{
			name: testName
		}, {
			name: testName2
		}],function (err) {
			if (err) return done(err);
			User.findAllLike({name: part},function(err,users) {
				if (err) return done(err);
				if (users.length < 1) return done(new Error('findAllLike() did not return anything!'));
				if (users[0].name !== testName || users[1].name !== testName2) return done(new Error('findAllLike() returned incorrect user!'));
				done(err);
			});
		});
	});

	it('should return proper users when using string syntax', function(done) {
		var part = 'findAllLike with string syntax';
		var testName = '340ajsdha test_ findAllLike with string syntax  -- aw40gasdha';
		var testName2 = 'zzbjfk test_ findAllLike with string syntax 2../haer-h';

		User.createEach([{
			name: testName
		}, {
			name: testName2
		}],function (err) {
			if (err) return done(err);
			User.findAllLike(part,function(err,users) {
				if (err) return done(err);
				if (users.length < 1) return done(new Error('findAllLike() did not return anything!'));
				if (users[0].name !== testName || users[1].name !== testName2) return done(new Error('findAllLike() returned incorrect user!'));
				done(err);
			});
		});
	});
});