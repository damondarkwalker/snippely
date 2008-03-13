Snippely.Snippets = {

	initialize: function(){
		this.list = $('snippets-list');
	},
	
	load: function(tag_id){
		var callback = function(result){
			var snippets = [];
			if (result.data) $each(result.data, function(snippet){
				snippets.push({
					id: snippet.id,
					title: snippet.title.unescape()
				});
			});
			this.build(snippets);
		}.bind(this);
		
		Snippely.database.execute(this.Queries.select, callback, {
			tag_id: tag_id
		});
	},
	
	build: function(snippets){
		this.list.empty();
		var elements = snippets.map(this.create, this);
		this.elements = $$(elements);
		this.redraw();
	},
	
	create: function(snippet){
		var element = new Element('li', {
			id: 'snippet_' + snippet.id,
			text: snippet.title
		});
		
		new Editable(element, { onBlur: this.save.bind(this) });
		
		this.list.adopt(element.addEvents({
			click: this.select.bind(this, element),
			mousedown: function(event){ event.stopPropagation(); }
		}).store('snippet:id', snippet.id));
		
		return element;
	},
	
	add: function(){
		var tag = Snippely.Tags.selected;
		if (!tag) return;
		
		var callback = function(result){
			var element = this.create({
				id: result.lastInsertRowID,
				title: 'New Snippet'
			});
			this.elements.push(element);
			this.select(element);
			this.redraw();
			element.fireEvent('dblclick');
		}.bind(this);
		
		Snippely.database.execute(this.Queries.insert, callback, {
			tag_id: tag.retrieve('tag:id')
		});
	},
	
	remove: function(){
		if (!this.selected || !confirm("Are you sure you want to remove this Snippet?")) return;
		
		Snippely.database.execute(this.Queries.remove, {
			id: this.selected.retrieve('snippet:id')
		});
		
		//TODO - remove all this snippet's snips from the database
		this.selected.destroy();
	},
	
	rename: function(){
		if (!this.selected) return;
		this.selected.fireEvent('dblclick');
	},
	
	save: function(element){
		var id = element.retrieve('snippet:id');
		var title = element.get('text');
		var callback = function(){
			if (Snippely.Snippet.id && Snippely.Snippet.id == id) Snippely.Snippet.title.set('text', title);
		};
		
		Snippely.database.execute(this.Queries.update, callback, {
			id: id,
			title: title.escape()
		});
	},
	
	select: function(element){
		if (element == this.selected) return;
		
		this.elements.removeClass('selected');
		this.selected = element.addClass('selected');
		
		var id = element.retrieve('snippet:id');
		Snippely.Snippet.load(id);
		Snippely.Snips.load(id);
	},
	
	redraw: function(){
		this.elements.removeClass('odd');
		this.list.getElements(':odd').addClass('odd');
		Snippely.redraw();
	}	
	
};

//Snippet related queries

Snippely.Snippets.Queries = {
	
	select: "SELECT id, title FROM snippets WHERE tag_id = :tag_id",
	
	insert: "INSERT INTO snippets (tag_id, title, description) VALUES (:tag_id, 'New Snippet', 'Description')",
	
	remove: "DELETE FROM snippets WHERE id = :id",
	
	update: "UPDATE snippets SET title = :title WHERE id = :id"
	
};