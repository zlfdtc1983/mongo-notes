var DEBUG = true;

$(document).ready(function(){

	jQuery.fn.log = function (msg) {
		if (DEBUG && window.console)
			console.log("%s: %o", msg, this);
	 	return this;
	};

	$.ajaxSetup({
  		crossDomain: true,
		contentType: "application/json",
		error: function(request, status, error) {
	    	showMessage(request.responseText, true);
	    	saveButton.log("Error: " + request.responseText);
	    }
	});


	var serviceUri = "v.1/notes/",
		infoIcon = $("#header-info-icon"),
	    infoText = $("#header-info-text"),
	    infoBox = $("#header-info"),
	    itemList = $("#list-items"),
	    noteTitle = $("#note-title"),
	    noteContent = $("#note-content"),
	    noteDate = $("#note-data-value"),
	    noteTags = $("#note-tags-text"),
	    saveButton = $("#note-save-button").button({ icons: { primary: "ui-icon-disk" } }),
	    deleteButton = $("#note-delete-button").button({ icons: { primary: "ui-icon-trash" } }),
	    addButton = $("#note-save-add").button({ icons: { primary: "ui-icon-circle-plus" } }),
	    queryInput = $("#list-search-text"),
	    selectedItem = null,
	    maxNumOfRecentNotes = 30,
	    defaultMessage = "Example app only, do not put here any notes you would not mind being deleted.",
	    availableTags = [];

	function showMessage(text, alert){
		if(alert){
			infoBox.removeClass("ui-state-highlight")
				    .addClass("ui-state-error");
			infoIcon.removeClass("ui-icon-info")
				    .addClass("ui-icon-alert");
		}else{
			infoBox.removeClass("ui-state-error")
				    .addClass("ui-state-highlight");
			infoIcon.removeClass("ui-icon-alert")
					.addClass("ui-icon-info");
		}
		infoText.html(text);
		return false;
	}
	
	function loadDetail(item){
		
		queryInput.val("");
		noteTags.val("");
		selectedItem = null;
		noteTitle.html("Note Title");
		noteContent.val("").htmlarea('updateHtmlArea');
		noteDate.empty();
		deleteButton.button("disable");
		showMessage(defaultMessage);
		availableTags = [];
		
		$.getJSON(serviceUri + "tags/all", function(data, status, xhr) {
			queryInput.log("Global Tags: " + data);
			availableTags = data;
		});
		
		
		if (item){
		
			itemList.log("Loading: " + item._id);
			queryInput.val(item.title);
					
			var itemId = encodeURIComponent(item._id);
			
			$.getJSON(serviceUri + itemId, function(data, status, xhr) {
				queryInput.log("Status: " + status);
	
				selectedItem = data;
				
				noteTitle.html(selectedItem.title);
				noteContent.val(selectedItem.content).htmlarea('updateHtmlArea');
				
				noteTags.log("Item Tags: " + selectedItem.tags);
				if (selectedItem.tags){
					var tagStr = selectedItem.tags.join(',');
					queryInput.log("Tags: " + tagStr);
					noteTags.val(tagStr);
				}
				
				var cleanDate = new Date(selectedItem.updatedOn);
				noteDate.html(cleanDate.toUTCString());
				
				deleteButton.button("enable");
				showMessage("Note selected for update");
	
			});
		} // note
	}
	
	function saveItem(){
		
		var itemId = (selectedItem) ? selectedItem._id : "";
		var itemTitle = noteTitle.html();
		var itemContent = noteContent.val();
		var itemTags = split(noteTags.val());
		
		if (itemTitle.length < 2) {
			//TODO: Externalize message
			showMessage("Note title must be at least 2 characters long", true);
			return false;
		}
		
		if (itemContent.length < 2) {
			//TODO: Externalize message
			showMessage("Note content must be at least 2 characters long", true);
			return false;
		}
		
		var note = {
			id: itemId,
			title: itemTitle,
			content: itemContent,
			tags: itemTags
		};
		
		$.ajax({
		    dataType : 'json',
		    type : 'POST',
		    url : serviceUri,
		    data : JSON.stringify(note),
		    success : function(data) {
		    	saveButton.log("OK");
		    	showMessage("Note successfully saved");
		    	initList();
		    }
		});
	}
	
	function deleteItem(){
		
		if (selectedItem == null || selectedItem._id == null) {
			//TODO: Externalize message
			showMessage("Please select an item", true);
			return false;
		}
		
		var itemId = encodeURIComponent(selectedItem._id);
		
		$.ajax({
		    type : 'DELETE',
		    url : serviceUri + itemId,
		    success : function(data) {
		    	saveButton.log("OK");
		    	showMessage("Note successfully deleted");
		    	loadDetail(null);
		    	initList();
		    },
		    error : function(request, status, error) {
		    	showMessage(request.responseText, true);
		    	saveButton.log("Error: " + request.responseText);
		    }
		});
	}
	
	function initList(){		
		itemList.empty();
		queryInput.val("").log("Quering recent...");
		$.getJSON(serviceUri + "recent/" + maxNumOfRecentNotes, function(data, status, xhr) {
			queryInput.log("Status: " + status);
			
			var recentItem = "<li class='ui-widget-content'></li>";
			var recentIcon = "<span class='ui-icon ui-icon-document'></span>";
			
			if (data){
				$.each(data, function(i, item) {
				    
					$(recentItem).append(recentIcon)
					             .append(item.title)
					             .data("item", item)
					             .appendTo(itemList);
				});
			}
		});
	}
	
	function split(val) {
		return val.split(/,\s*/);
	}
	
	function extractLast(term) {
		return split(term).pop();
	}
	
	addButton.click(function(){
		loadDetail();
	});
	
	saveButton.click(function(){
		saveItem();
	});
	
	deleteButton.click(function(){
		deleteItem();
	});
	
	itemList.selectable({
		selected: function(event, ui) {
			var selectedItem = $(ui.selected).data("item");
			loadDetail(selectedItem);
		}
	});

	noteTitle.editable(function(value, settings) { 
			$(this).log('Title: ' + value);
	     	return(value);
	  	},{
    		indicator: 'Saving...',
        	tooltip: 'Click to edit, hit enter to save',
        	cssclass: 'note-title-text',
        	onblur: 'submit'
    });

    // Set the default message
    showMessage(defaultMessage);

	// setup note editor
	noteContent.htmlarea();

	// initialize recent list
	initList();

	// bind autocomplete after the initial setup
	queryInput.autocomplete({
		minLength: 2,
		source: function(request, response) {
			var restUri = serviceUri + "search/" + encodeURIComponent(request.term);
			queryInput.log("Quering: " + restUri);
			$.getJSON(restUri, request, function(data, status, xhr) {
				queryInput.log("Status: " + status);
				queryInput.log("XHR: " + xhr);
				response(data);
			});
		},
		focus: function(event, ui) {
			return false;
		},
		select: function(event, ui) {
			// Clear selection from history
			$(".ui-selected", itemList).removeClass("ui-selected");
			loadDetail(ui.item);
			return false;
		}
	}).data("autocomplete")._renderItem = function(ul, item) {
		return $("<li class='list-search-item'></li>")
			.data("item.autocomplete", item)
		    .append("<a>" + item.title + "</a>")
			.appendTo(ul);
	};
	
	
	noteTags.bind("keydown", function(event) {
		if (event.keyCode === $.ui.keyCode.TAB && $(this).data("autocomplete").menu.active){
			event.preventDefault();
		}
	}).autocomplete({
		minLength: 1,
		source: function(request, response) {
			response( $.ui.autocomplete.filter(
				availableTags, extractLast(request.term)));
		},
		focus: function() {
			return false;
		},
		select: function(event, ui) {
			var terms = split(this.value);
			terms.pop();
			terms.push(ui.item.value);
			terms.push("");
			this.value = terms.join(", ");
			return false;
		}
	});
});



