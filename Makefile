index := release/index.html
storage := release/js/storage.js
unit := release/js/unit.js
unith := release/unit.html

all: release $(index) $(storage) $(unit) $(unith)

clean:
	rm -rf release

$(index) : doc/docu.html
	cp $^ $@

$(storage):	src/*js
	(cd tools && sh build.sh > ../release/js/storage.js)

$(unit): src/test/unit.js
	cp $^ $@
	
$(unith): src/test/unit.html
	cp $^ $@
	
release :
	mkdir -p release/js