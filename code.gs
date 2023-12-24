//------------------------------------------------------Startup functions------------------------------------------------------//

function onInstall(e) {
  onOpen(e);
}

function onOpen(e) {
  
  if (e && e.authMode == ScriptApp.AuthMode.NONE) {
  } else {
    resetSettingsIfEmpty();
  }
  
  DocumentApp.getUi().createAddonMenu()
      .addItem('Open Sidebar', 'showSidebar')
      .addSeparator()
      .addItem('Shrink','shrink')
      .addItem('Cardify', 'cardify')
      .addItem('Extract','extract')
      .addItem('Condense','condense')
      .addItem('Highlight','highlight')
      .addItem('Reformat','reformat')
      .addSeparator()
      .addItem('Import Styles','importHeadings')
      .addItem('Wikify','wikify')
      .addSeparator()
      .addItem('Send to Doc','speechDoc')
      .addSeparator()
      .addItem('Settings','showSettingsPage')
      .addToUi();
}

function showSidebar() {
  var ui = HtmlService.createHtmlOutputFromFile('index')
      .setTitle('DebateX');
  DocumentApp.getUi().showSidebar(ui);
}

//------------------------------------------------------Settings Functions------------------------------------------------------//


function showSettingsPage() {
  var html = HtmlService.createHtmlOutputFromFile('settings')
  .setWidth(500)
  .setHeight(500);
  DocumentApp.getUi()
  .showModalDialog(html, 'Settings');
}

function pushSettings(allSettings) {
  var userProperties = PropertiesService.getUserProperties();
  var documentProperties = PropertiesService.getDocumentProperties();
  
  if(userProperties.getProperty('SPEECH_DOC_URL') == allSettings[0]) {
  } else {
    userProperties.setProperty('SPEECH_DOC_ID', '');
  }
  
  userProperties.setProperties({
    'SPEECH_DOC_URL': allSettings[0],
    'HIGHLIGHT_COLOR': allSettings[1],
    'SHRINK_SIZE': allSettings[2],
    'SHRINK_IGNORE': allSettings[3],
    'UNDERLINE_TO_BOLD' : allSettings[4], 
    'UNDERLINE_TO_HIGHLIGHT' : allSettings[5],
    'BOLD_TO_UNDERLINE' : allSettings[6],
    'BOLD_TO_HIGHLIGHT' : allSettings[7],
    'CARDIFY_SHRINK_SIZE' : allSettings[8]
  });
  
}

function getSettings() {
  var userProperties = PropertiesService.getUserProperties();
  
  var speechDocUrl = userProperties.getProperty('SPEECH_DOC_URL');
  var highlightColor = userProperties.getProperty('HIGHLIGHT_COLOR');
  var shrinkSize = userProperties.getProperty('SHRINK_SIZE');
  var shrinkIgnore = userProperties.getProperty('SHRINK_IGNORE');
  var underlineToBold = userProperties.getProperty('UNDERLINE_TO_BOLD');
  var underlineToHighlight = userProperties.getProperty('UNDERLINE_TO_HIGHLIGHT');
  var boldToUnderline = userProperties.getProperty('BOLD_TO_UNDERLINE');
  var boldToHighlight = userProperties.getProperty('BOLD_TO_HIGHLIGHT');
  var cardifyShrinkSize = userProperties.getProperty('CARDIFY_SHRINK_SIZE');
  
  return [
    speechDocUrl,
    highlightColor,
    shrinkSize,
    shrinkIgnore,
    underlineToBold,
    underlineToHighlight,
    boldToUnderline,
    boldToHighlight,
    cardifyShrinkSize
  ];
  
  
}

function resetSettingsIfEmpty() {
  
  var allSettings = getSettings();
  var userProperties = PropertiesService.getUserProperties();
  
  for(var i = 0; i < allSettings.length; i++) {
    var setting = allSettings[i];
    
    if(setting) {
      return "";
    }
    
  }
  
  userProperties.setProperties({
    'SPEECH_DOC_URL': "",
    'HIGHLIGHT_COLOR': "#ffff00",
    'SHRINK_SIZE': "8",
    'SHRINK_IGNORE': "underline",
    'UNDERLINE_TO_BOLD' : "t", 
    'UNDERLINE_TO_HIGHLIGHT' : "",
    'BOLD_TO_UNDERLINE' : "t",
    'BOLD_TO_HIGHLIGHT' : "t",
    'CARDIFY_SHRINK_SIZE' : "8"
  });
  
}


//------------------------------------------------------Alerts and Errors------------------------------------------------------//

function footnotePrompt(number) {
  var ui = DocumentApp.getUi();
  
  var result = ui.alert(
    'Your document contains: ' + number + ' footnote(s).',
    'Footnotes do not work with the speech doc functions. Would you like to delete all footnotes?',
    ui.ButtonSet.YES_NO);
  
  if (result == ui.Button.YES) {
    confirmPrompt();
  } else {
  }
}

function confirmPrompt() {
  var ui = DocumentApp.getUi();
  
  var result = ui.alert(
    'Are you sure?',
    'Press YES to delete all footnotes.',
    ui.ButtonSet.YES_NO);
  
  if (result == ui.Button.YES) {
    removeFootnotes();
  } else {
  }
}

function tocSpeechAlert() {
  var ui = DocumentApp.getUi();
  
  var result = ui.alert(
    'Your document order was significantly changed.',
    'You must click the refresh button every time you change your document, or your speech doc will be out of order.',
    ui.ButtonSet.OK);
  
}

function noSpeechDocAlert() {
  var ui = DocumentApp.getUi();
  
  var result = ui.alert(
    "No speech doc linked",
    'Go to settings (☰) to set the URL for your speech doc.',
    ui.ButtonSet.OK);
  
}

function getAllFootnotes() {
  var doc = DocumentApp.getActiveDocument();
  var footnotes = doc.getFootnotes();
  if(footnotes.length > 0) {
    footnotePrompt(footnotes.length);
    return '';
  }

}

function removeFootnotes() {
  DocumentApp.getActiveDocument()
    .getFootnotes()
    .forEach(f => f.removeFromParent());
}

//------------------------------------------------------SPEECH DOC FUNCTIONS------------------------------------------------------//


function speechDoc() {
  var currentDoc = DocumentApp.getActiveDocument().getSelection();
  var cursor = DocumentApp.getActiveDocument().getCursor();
  
  var userProperties = PropertiesService.getUserProperties();
  var url = userProperties.getProperty('SPEECH_DOC_URL');
  var id = userProperties.getProperty('SPEECH_DOC_ID');
  
  //Checks for id first (which is used if the user clicked new document)
  if(id) {
    var targetDoc = DocumentApp.openById(id);
  } else if (url) {
    var targetDoc = DocumentApp.openByUrl(url);
  } else {
    noSpeechDocAlert();
    return '';
  }
  
  //if you are selecting some text, this function will transfer your selection into the target document
  if(currentDoc) {
    var totalElements = currentDoc.getRangeElements();
    
    //for each element in your selection
    for( var index = 0; index < totalElements.length; ++index ) {
      var body = targetDoc.getBody();
      var element = totalElements[index].getElement().copy();
      var type = element.getType();
      
      
      //gets the element type and transfers it over to the target doc
      if( type == DocumentApp.ElementType.PARAGRAPH ){
        body.appendParagraph(element);
      }
      //if the element is just text, it's a PARTIAL element, so you need to get it's parent in order for it to transfer properly            
      else if ( type == DocumentApp.ElementType.TEXT) {            
        var parent = totalElements[index].getElement().getParent();            
        body.appendParagraph(parent.copy());            
      }
      else if( type == DocumentApp.ElementType.TABLE){
        body.appendTable(element);
      }
      else if( type == DocumentApp.ElementType.LIST_ITEM){
        body.appendListItem(element).setGlyphType(DocumentApp.GlyphType.NUMBER);
      }
      else if( type == DocumentApp.ElementType.INLINE_IMAGE ){
        body.appendImage(element);
      }
      else if( type == DocumentApp.ElementType.HORIZONTAL_RULE ){
        body.appendHorizontalRule();
      }
      else if( type == DocumentApp.ElementType.PAGE_BREAK ){
        body.appendPageBreak();
      }
      else {
        
      }
    }
    
    //if your cursor is on some heading, this function will transfer everything under that heading (using heading hierarchy) 
  } else if(cursor) {
    
    //gets the element your cursor is on
    var element = cursor.getElement();
    
    //sends it to this function
    speechDocByElement(element);
    
  } else {}

}
  
  
function speechDocByElement(element) {
  
  var userProperties = PropertiesService.getUserProperties();
  var url = userProperties.getProperty('SPEECH_DOC_URL');
  
  var id = userProperties.getProperty('SPEECH_DOC_ID');
  
  if(id) {
    var targetDoc = DocumentApp.openById(id);
  } else if (url) {
    var targetDoc = DocumentApp.openByUrl(url);
  } else {
    noSpeechDocAlert();
    return '';
  }
    
  var sentinel = false;
  
  //if the element isn't a paragraph, set element to it's parent
  if(!(element.getType() == DocumentApp.ElementType.PARAGRAPH)) {
    element = element.getParent();
  }
  
  var body = targetDoc.getBody();
  
  //gets the heading level of the first element
  var initialElementType = element.getHeading();
  
  //sends the first element that the cursor is on to the document
  body.appendParagraph(element.copy());
  
  while (sentinel == false) { 
    
    //gets the next sibling of each element
    var nextElement = element.getNextSibling();
    if(nextElement) {
      element = nextElement;
      var elementText = nextElement.getText();
    } else { //if it's the end of the document just end the function
      return '';
    }
    
    if (element.getType() == DocumentApp.ElementType.PARAGRAPH) {
      
      //if the heading of the current paragraph is equal to the initial elements heading, stop the loop
      if(element.asParagraph().getHeading() == initialElementType) {
        
        //this if statement makes sure the loop doesn't stop at EMPTY heading elements 
        if (elementText.replace(/ /g, '').length) {
          sentinel = true;
        } else {body.appendParagraph(nextElement.copy());}
        
        //if the heading type is LESS than the initial elements heading (h1 < h2) stop the loop
      } else if(element.asParagraph().getHeading() < initialElementType) {
        
        if (elementText.replace(/ /g, '').length) {
          sentinel = true;
        } else {body.appendParagraph(nextElement.copy());}
        
        //if the element is underneath the initial elements heading, it is moved into the doc!
      } else {
        body.appendParagraph(nextElement.copy());
        
      }
      
    } else {
      
      if(element.getType() == DocumentApp.ElementType.TABLE) {
        body.appendTable(element.copy());
      }
      if(element.getType() == DocumentApp.ElementType.LIST_ITEM) {
        body.appendListItem(element.copy()).setGlyphType(DocumentApp.GlyphType.NUMBER);
      }
    }
    
    
  }
}

function tableOfContents() {
  
  var currentDoc = DocumentApp.getActiveDocument().getBody();
  var paragraphs = currentDoc.getParagraphs();
  var headingText = [];
  var headingType = [];
  var elementIndex = [];
  
  for( var index = 0; index < paragraphs.length; ++index ) {
    var element = paragraphs[index];
    var elementText = element.copy().getText();
    var heading = element.getHeading();
        
    if (elementText.replace(/ /g, '').length) {
      if(heading == DocumentApp.ParagraphHeading.HEADING1) {
        headingType.push(1);
        headingText.push(elementText);
        elementIndex.push(index);
      } 
      else if (heading == DocumentApp.ParagraphHeading.HEADING2) {
        headingType.push(2);
        headingText.push(elementText);
        elementIndex.push(index);
      }
      else if (heading == DocumentApp.ParagraphHeading.HEADING3) {
        headingType.push(3);
        headingText.push(elementText);
        elementIndex.push(index);
      }
      else if (heading == DocumentApp.ParagraphHeading.HEADING4) {
        headingType.push(4);
        headingText.push(elementText);
        elementIndex.push(index);
      }
    } else {
    }
    
}
  
  
  return [
    headingText,
    headingType,
    elementIndex
  ];
  
}



function speechDocByList (ids, paragraphTexts, elementIndexes) {
    
  var currentDoc = DocumentApp.getActiveDocument().getBody();
  var paragraphs = currentDoc.getParagraphs();
  
  for( var i = 0; i < ids.length; ++i ) {
    var currentId = ids[i];
    var paragraphId = elementIndexes[currentId];
    var currentParagraph = paragraphs[paragraphId];
    var currentText = paragraphTexts[currentId];
    
    //assume that it's the correct element if the text is the same, and the position is the same
    if (currentParagraph.getText() == currentText) {
      speechDocByElement(currentParagraph);
      Logger.log("yes");
    } else {
      tocSpeechAlert();
      return '';
    }
    
  }
}

function newDocument() {
  var document = DocumentApp.create("New Speech Doc");
  var userProperties = PropertiesService.getUserProperties();
  var url = document.getUrl();
  
  //returns id instead of url because url gives issues
  var id = document.getId();
  userProperties.setProperty('SPEECH_DOC_URL', url);
  userProperties.setProperty('SPEECH_DOC_ID', id);
  return url;
}

function openDocument() {
  var userProperties = PropertiesService.getUserProperties();
  var url = userProperties.getProperty('SPEECH_DOC_URL');
  return url;
  
}


//-----------------------------------------------------Wiki-related Functions-----------------------------------------------------//



//this function converts every heading in the document to debate wiki syntax
function wikify() {
  
  var currentDocument = DocumentApp.getActiveDocument().getBody().editAsText();
  var currentSelection = DocumentApp.getActiveDocument().getSelection();
  
  if(currentSelection) {
    var elements = currentSelection.getRangeElements();
    
    for (var index = 0; index < elements.length; index++) {
      var element = elements[index].getElement();
      var type = element.getType();
      
      //for each element, if it's a paragraph, get the type of heading it is, and add '=' signs accordingly
      if( type == DocumentApp.ElementType.PARAGRAPH ){
        
        if(element.asParagraph().getHeading() == DocumentApp.ParagraphHeading.HEADING1 ){
          element.asText().editAsText().appendText('=');
          element.asText().editAsText().insertText(0, '=');
        }
        else if(element.asParagraph().getHeading() == DocumentApp.ParagraphHeading.HEADING2 ){
          element.asText().editAsText().appendText('==');
          element.asText().editAsText().insertText(0, '==');
        }
        else if(element.asParagraph().getHeading() == DocumentApp.ParagraphHeading.HEADING3 ){
          element.asText().editAsText().appendText('===');
          element.asText().editAsText().insertText(0, '===');
        }
        else if(element.asParagraph().getHeading() == DocumentApp.ParagraphHeading.HEADING4 ){
          element.asText().editAsText().appendText('====');
          element.asText().editAsText().insertText(0, '====');
        }
        else {}
        
        //at the end, set the text to NORMAL to remove all formatting and make it plain (the wiki takes in plain text anyway)
        element.asParagraph().setHeading(DocumentApp.ParagraphHeading.NORMAL);
      } 
    }
  } 
}

//imports classic microsoft word headings for debate into the document from another document
function importHeadings() {
  var importDoc = DocumentApp.openById('1tn9xRj8qiw8MkAqzQT1fsxuwwajFuF-I7iiVyFbFT2I');
  var currentDoc = DocumentApp.getActiveDocument().getBody();
  var elements = importDoc.getBody().getParagraphs();
  
  for (var i = 0; i < elements.length; i++) {
    
    var currentElement = elements[i];
    
    if(currentElement.getType() == DocumentApp.ElementType.PARAGRAPH) {
      
      var copy = currentDoc.appendParagraph(currentElement.copy()); 
      
    } 
  }
  
  //sets cursor position to the end
  var doc = DocumentApp.getActiveDocument();
  var paragraph = currentDoc.appendParagraph('');
  var position = doc.newPosition(paragraph, 0);
  doc.setCursor(position);
  
}



//------------------------------------------------------ALL CARD-RELATED FUNCTIONS------------------------------------------------------//      (a 'card' is a piece of evidence in debate)



//this function custom formats the paragraph
function cardify() {
  
  var userProperties = PropertiesService.getUserProperties();
  var highlightColor = userProperties.getProperty('HIGHLIGHT_COLOR');
  var cardifyShrink = userProperties.getProperty('CARDIFY_SHRINK_SIZE');
  var selectedText = DocumentApp.getActiveDocument().getSelection();
  var cursor = DocumentApp.getActiveDocument().getCursor();
  
  if(selectedText) {	

    var elements = selectedText.getRangeElements();	

    for (var index = 0; index < elements.length; index++) {	

      var element = elements[index];	

      if(element.getElement().editAsText) {     	

        var text = element.getElement().editAsText();	
        var indices = text.getTextAttributeIndices();	
        var textLength = text.getText().length;	
        var underline = [];	
        var bold = [];	
        var none = [];	
        
        //gets whether each section of text is bold, underline, or neither
        for (let i = 0; i < indices.length; i++) {	
          if (text.isUnderline(indices[i])) {	
            underline.push(true);	
          } else {	
            underline.push(false);	
          }	
          if (text.isBold(indices[i])) {	
            bold.push(true);	
          } else {	
            bold.push(false);	
          }	
          if (underline[i] || bold[i]) {	
            none.push(false);	
          } else {	
            none.push(true);	
          }	
        }	
        
        //sets formatting to those sections accordingly
        for (let p = 0; p < indices.length; p++) {	
          const startOffset = indices[p];	
          const endOffset = p + 1 < indices.length ? indices[p + 1] - 1 : textLength - 1;	

          if(underline[p] == true) {
            if(userProperties.getProperty('UNDERLINE_TO_BOLD')) {
              text.setBold(startOffset, endOffset, true);
            }
            if (userProperties.getProperty('UNDERLINE_TO_HIGHLIGHT')) {
              text.setBackgroundColor(startOffset, endOffset, highlightColor);  
            }
          }	
          if(bold[p] == true) {	
            if(userProperties.getProperty('BOLD_TO_UNDERLINE')) {
              text.setUnderline(startOffset, endOffset, true);
            }
            if (userProperties.getProperty('BOLD_TO_HIGHLIGHT')) {
              text.setBackgroundColor(startOffset, endOffset, highlightColor);  
            } 	
          }	
          if(none[p] == true) {	
            text.setFontSize(startOffset, endOffset, cardifyShrink);	
          }	
        }	
      }	
    }
  } else if (cursor) {
    
    var element = cursor.getElement();
    
    if(element.editAsText) {
      
      var text = element.editAsText();	
      var indices = text.getTextAttributeIndices();	
      var textLength = text.getText().length;	
      var underline = [];
      var bold = [];	
      var none = [];
      
      for (let i = 0; i < indices.length; i++) {
        if (text.isUnderline(indices[i])) {	
          underline.push(true);	
        } else {	
          underline.push(false);	
        }	
        if (text.isBold(indices[i])) {	
          bold.push(true);	
        } else {	
          bold.push(false);	
        }
        if (underline[i] || bold[i]) {	
          none.push(false);	
        } else {	
          none.push(true);	
        }
      }

      for (let p = 0; p < indices.length; p++) {
        const startOffset = indices[p];	
        const endOffset = p + 1 < indices.length ? indices[p + 1] - 1 : textLength - 1;	
        
        if(underline[p] == true) {
          if(userProperties.getProperty('UNDERLINE_TO_BOLD')) {
            text.setBold(startOffset, endOffset, true);
          }
          if (userProperties.getProperty('UNDERLINE_TO_HIGHLIGHT')) {
            text.setBackgroundColor(startOffset, endOffset, highlightColor);  
          }
        }	
        if(bold[p] == true) {	
          if(userProperties.getProperty('BOLD_TO_UNDERLINE')) {
            text.setUnderline(startOffset, endOffset, true);
          }
          if (userProperties.getProperty('BOLD_TO_HIGHLIGHT')) {
            text.setBackgroundColor(startOffset, endOffset, highlightColor);  
          } 	
        }	
        if(none[p] == true) {	
          text.setFontSize(startOffset, endOffset, cardifyShrink);	
        }	
      } 
    }
  }
}



//shrinks all non-underlined text to a smaller size -- follows the same structure as all other card functions
function shrink() {
  
  var userProperties = PropertiesService.getUserProperties();
  var shrinkSize = userProperties.getProperty('SHRINK_SIZE');
  var shrinkIgnore = userProperties.getProperty('SHRINK_IGNORE');
  
  var selectedText = DocumentApp.getActiveDocument().getSelection();  
  var cursor = DocumentApp.getActiveDocument().getCursor();
  
  if(selectedText) {
    
    var elements = selectedText.getRangeElements();
    
    for (var index = 0; index < elements.length; index++) {
      
      var element = elements[index];
      
      if(element.getElement().editAsText) {
        
        var text = element.getElement().editAsText();
        var indices = text.getTextAttributeIndices();
        var textLength = text.getText().length;
        
        for (let i = 0; i < indices.length; i++) {
          const startOffset = indices[i];
          
          const endOffset = i + 1 < indices.length ? indices[i + 1] - 1 : textLength - 1;
          
          if (shrinkIgnore == "underline") {
            if (text.isUnderline(indices[i])) {
            } else {
              text.setFontSize(startOffset, endOffset, shrinkSize);
            }
          } else if (shrinkIgnore == "highlight") {
            if (text.getBackgroundColor(indices[i])) {
            } else {
              text.setFontSize(startOffset, endOffset, shrinkSize);
            }
          } else if (shrinkIgnore == "bold") {
            if (text.isBold(indices[i])) {
            } else {
              text.setFontSize(startOffset, endOffset, shrinkSize);
            }
          }
          
        }
      } 
    }
  } else if (cursor) {
    
    var element = cursor.getElement();
    
    if(element.editAsText) {   
      
      var text = element.asText();
      var indices = text.getTextAttributeIndices();
      var textLength = text.getText().length;
      
      for (let i = 0; i < indices.length; i++) {
        const startOffset = indices[i];
        
        const endOffset = i + 1 < indices.length ? indices[i + 1] - 1 : textLength - 1;
        
        if (shrinkIgnore == "underline") {
          if (text.isUnderline(indices[i])) {
          } else {
            text.setFontSize(startOffset, endOffset, shrinkSize);
          }
        } else if (shrinkIgnore == "highlight") {
          if (text.getBackgroundColor(indices[i])) {
          } else {
            text.setFontSize(startOffset, endOffset, shrinkSize);
          }
        } else if (shrinkIgnore == "bold") {
          if (text.isBold(indices[i])) {
          } else {
            text.setFontSize(startOffset, endOffset, shrinkSize);
          }
        }
        
      }
    }
  }
}


//this function resets the formatting of some text to its DEFAULT, while still preserving bolded/highlighted/underlined text!!
function reformat() {
  var selectedText = DocumentApp.getActiveDocument().getSelection();  
  
  var userProperties = PropertiesService.getUserProperties();
  var highlightColor = userProperties.getProperty('HIGHLIGHT_COLOR');
  
  if(selectedText) {
    
    var elements = selectedText.getRangeElements();
    
    for (var index = 0; index < elements.length; index++) {
      
      var element = elements[index];
      
      //if it's a partial element you need to get it's parent
      if(element.isPartial()) {
        element = element.getElement().getParent();
      } else {
        element = element.getElement();
      }
      
      
      if(element.editAsText) {     
        
        var text = element.editAsText();
        var indices = text.getTextAttributeIndices();
        var textLength = text.getText().length;
        var underline = [];
        var highlight = [];
        var bold = [];
        
        //for each indice, records if the text is bolded/highlighted/underlined so you can apply that formatting after it's reset
        if(element.asParagraph().getHeading() == DocumentApp.ParagraphHeading.NORMAL) {
          for (let i = 0; i < indices.length; i++) {
            if (text.isUnderline(indices[i])) {
              underline.push(true);
            } else {
              underline.push(false);
            }
            if (text.getBackgroundColor(indices[i])) {
              highlight.push(true);
            } else {
              highlight.push(false);
            }
            if (text.isBold(indices[i])) {
              bold.push(true);
            } else {
              bold.push(false);
            }
            
          }
        }
        
        //now you reset each paragraph to it's original heading type
        if(element.getType() == DocumentApp.ElementType.PARAGRAPH) {
          var headingType = element.asParagraph().getHeading();
          element.asParagraph().setHeading(headingType);
        }
        
        //now you re-apply the formatting back to the text you just reset
        for (let p = 0; p < indices.length; p++) {
          const startOffset = indices[p];
          const endOffset = p + 1 < indices.length ? indices[p + 1] - 1 : textLength - 1;
          
          if(underline[p] == true) {
            text.setUnderline(startOffset, endOffset, true);
          }
          if(highlight[p] == true) {
            text.setBackgroundColor(startOffset, endOffset, highlightColor); 
          }
          if(bold[p] == true) {
            text.setBold(startOffset, endOffset, true);
          }
        }
      }
    }
  }
}


function extract() {
  var selectedText = DocumentApp.getActiveDocument().getSelection();
  var rangeBuilder = DocumentApp.getActiveDocument().newRange();
  
  if(selectedText) {
    
    var elements = selectedText.getRangeElements();
    
    for (var index = 0; index < elements.length; index++) {
      
      var element = elements[index];
      
      if(element.getElement().editAsText) {      
        
        var text = element.getElement().editAsText();
        var indices = text.getTextAttributeIndices();
        var textLength = text.getText().length;
        var highlightSections = 0;
        
        //for every indice (formatting change), check if it's underlined. if it is, add it to a rangebuilder
        for (let i = 0; i < indices.length; i++) {
          const startOffset = indices[i];
          
          const endOffset = i + 1 < indices.length ? indices[i + 1] - 1 : textLength - 1;
          /*this variable makes sure that when the loop is running for the last time, the endOffset is set 
          to the end of the paragraph, to make sure that the last chunk of text gets formatted*/
          
          if (text.getBackgroundColor(indices[i])) {
            rangeBuilder.addElement(text, startOffset, endOffset);
            highlightSections += 1;
          } else {
            
          }
        }
      } 
    }
    
    //at the end, set the users selection to everything in the rangebuilder (so they can copy/paste the text somewhere, etc)
    if(highlightSections) {
      DocumentApp.getActiveDocument().setSelection(rangeBuilder.build());
    }
    
  }
}

//condenses paragraphs that are split apart into the same paragraph (useful when copying from articles)
function condense() {
  
  var selectedText = DocumentApp.getActiveDocument().getSelection();
  
  if(selectedText) {
    
    var totalElements = selectedText.getRangeElements();
    
    if(totalElements.length > 1) {
      var firstElement = totalElements[0].getElement();
      firstElement.asText().appendText(" ");
      
      for(var i = 1; i < totalElements.length; i++) {
        var element = totalElements[i].getElement();
        element.asText().appendText(" ");
        
        if(element.getType() === DocumentApp.ElementType.PARAGRAPH) {
          element.merge();
        }
        else {
          element.getParent().asParagraph().merge();
        }
        
      }
      
    }
    
    
  }
}


//highlights (sets background color) to any text you are currently highlighting
function highlight() {
  
  var selectedText = DocumentApp.getActiveDocument().getSelection();
  
  var userProperties = PropertiesService.getUserProperties();
  var highlightColor = userProperties.getProperty('HIGHLIGHT_COLOR');
  
  if(selectedText) {
    var elements = selectedText.getRangeElements();
    
    for(let i = 0; i < elements.length; i++) {
      var element = elements[i];
      
      if(element.getElement().editAsText) {
        
        //gets the beginning and end of text that you are selecting
        var start = element.getStartOffset();
        var end = element.getEndOffsetInclusive();
        
        var text = element.getElement().editAsText();
        
        if(end > 0) {
          text.setBackgroundColor(start, end, highlightColor);
        } else {
          text.setBackgroundColor(highlightColor);
        }
        
      }
      
    }
  }
}


//for some reason logging in the HTML file doesn't work
function loggerHack(variableToLog) {
  Logger.log(variableToLog);
}
