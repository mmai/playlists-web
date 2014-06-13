publish:
	rsync -av build/ gh-pages/
	cd gh-pages
	git add --ignore-errors * 
	git commit -am"update pages"
	git push

