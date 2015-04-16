path = require 'path'
_ = require 'lodash'
request = require 'request-json'

parseReplyData = (error, response, callback, cacheCallback) ->
  if error
    callback error, response
  else if response && response.ReplyCode && response.ReplyCode > 399
    error = new Error(response.ReplyText)
    error.statusCode = response.ReplyCode
    callback error
  else if response && response.ReplyCode != 200 && response.ReplyCode != 201
    callback error, response
  else if response.ReplyData && response.ReplyData.length > 0
    if cacheCallback then cacheCallback response.ReplyData[0]
    callback error, response.ReplyData[0]
  else
    callback error, response

parseBody =  (body) ->
  if typeof body is "string" and body isnt ""
    try
      parsed = JSON.parse body
    catch err
      parsed = body
  else parsed = body
  parsed

defaultWipOverrideReason = "WIP Override performed by external system"

exports.createClient = (account, email, password, options = {}) -> new exports.LeanKitClient account, email, password, options


class exports.LeanKitClient
  boardIdentifiers = {}

  constructor: (account, email, password, options = {}) ->
    url = 'https://' + account + '.leankit.com/kanban/api/'
    if account is 'kanban-cibuild'
      url = 'http://kanban-cibuild.localkanban.com/kanban/api/'

    if not password?
      options = email || {}

    @client = request.createClient(url, options)
    if password?
      @client.setBasicAuth email, password

  getBoards: (callback) ->
    @client.get 'boards', (err, res, body) ->
      parseReplyData err, body, callback

  getNewBoards: (callback) ->
    @client.get 'ListNewBoards', (err, res, body) ->
      parseReplyData err, body, callback

  getBoard: (boardId, callback) ->
    @client.get 'boards/' + boardId, (err, res, body) ->
      parseReplyData err, body, callback

  getBoardByName: (boardToFind, callback) ->
    $this = this
    @getBoards (err, boards) ->
      if boards && boards.length > 0
        board = _.find boards, { 'Title' : boardToFind }
        if board && board.Id > 0
          $this.getBoard board.Id, callback
        else
          callback err, board
      else
        callback err, null

  getBoardIdentifiers: (boardId, callback) ->
    if boardId of boardIdentifiers
      # console.log 'Using cached version'
      callback null, boardIdentifiers[boardId]
    @client.get 'board/' + boardId + '/GetBoardIdentifiers', (err, res, body) ->
      parseReplyData err, body, callback, (data) ->
        boardIdentifiers[boardId] = data

  getBoardBacklogLanes: (boardId, callback) ->
    @client.get 'board/' + boardId + '/backlog', (err, res, body) ->
      parseReplyData err, body, callback

  getBoardArchiveLanes: (boardId, callback) ->
    @client.get 'board/' + boardId + '/archive', (err, res, body) ->
      parseReplyData err, body, callback

  getBoardArchiveCards: (boardId, callback) ->
    @client.get 'board/' + boardId + '/archivecards', (err, res, body) ->
      parseReplyData err, body, callback

  getNewerIfExists: (boardId, version, callback) ->
    @client.get 'board/' + boardId + '/boardversion/' + version + '/getnewerifexists', (err, res, body) ->
      parseReplyData err, body, callback

  getBoardHistorySince: (boardId, version, callback) ->
    @client.get 'board/' + boardId + '/boardversion/' + version + '/getboardhistorysince', (err, res, body) ->
      parseReplyData err, body, callback

  getBoardUpdates: (boardId, version, callback) ->
    @client.get 'board/' + boardId + '/boardversion/' + version + '/checkforupdates', (err, res, body) ->
      parseReplyData err, body, callback

  getCard: (boardId, cardId, callback) ->
    @client.get 'board/' + boardId + '/getcard/' + cardId, (err, res, body) ->
      parseReplyData err, body, callback

  getCardByExternalId: (boardId, externalCardId, callback) ->
    @client.get 'board/' + boardId + '/getcardbyexternalid/' + encodeURIComponent(externalCardId), (err, res, body) ->
      parseReplyData err, body, callback

  addCard: (boardId, laneId, position, card, callback) ->
    @addCardWithWipOverride boardId, laneId, position, defaultWipOverrideReason, card, callback

  addCardWithWipOverride: (boardId, laneId, position, wipOverrideReason, card, callback) ->
    card.UserWipOverrideComment = wipOverrideReason
    @client.post 'board/' + boardId + '/AddCardWithWipOverride/Lane/' + laneId + '/Position/' + position, card, (err, res, body) ->
      parseReplyData err, body, callback

  addCards: (boardId, cards, callback) ->
    @addCardsWithWipOverride boardId, cards, defaultWipOverrideReason, callback

  addCardsWithWipOverride: (boardId, cards, wipOverrideReason, callback) ->
    @client.post 'board/' + boardId + '/AddCards?wipOverrideComment=' + encodeURIComponent(wipOverrideReason), cards, (err, res, body) ->
      parseReplyData err, body, callback

  moveCard: (boardId, cardId, toLaneId, position, wipOverrideReason, callback) ->
    @client.post 'board/' + boardId + '/movecardwithwipoverride/' + cardId + '/lane/' + toLaneId + '/position/' + position, { comment: wipOverrideReason }, (err, res, body) ->
      parseReplyData err, body, callback

  moveCardByExternalId: (boardId, externalCardId, toLaneId, position, wipOverrideReason, callback) ->
    @client.post 'board/' + boardId + '/movecardbyexternalid/' + encodeURIComponent(externalCardId) + '/lane/' + toLaneId + '/position/' + position, { comment: wipOverrideReason }, (err, res, body) ->
      parseReplyData err, body, callback

  moveCardToBoard: (cardId, destinationBoardId, callback) ->
    @client.post 'card/movecardtoanotherboard/' + cardId + '/' + destinationBoardId, null, (err, res, body) ->
      parseReplyData err, body, callback

  updateCard: (boardId, card, callback) ->
    card.UserWipOverrideComment = defaultWipOverrideReason
    @client.post 'board/' + boardId + '/UpdateCardWithWipOverride', card, (err, res, body) ->
      parseReplyData err, body, callback

  updateCardFields: (updateFields, callback) ->
    @client.post 'card/update', updateFields, (err, res, body) ->
      parseReplyData err, body, callback

  updateCards: (boardId, cards, callback) ->
    @client.post 'board/' + boardId + '/updatecards?wipoverridecomment=' + encodeURIComponent(defaultWipOverrideReason), cards, (err, res, body) ->
      parseReplyData err, body, callback

  getComments: (boardId, cardId, callback) ->
    @client.get 'card/getcomments/' + boardId + '/' + cardId, (err, res, body) ->
      parseReplyData err, body, callback

  addComment: (boardId, cardId, userId, comment, callback) ->
    data = { PostedById: userId, Text: comment }
    @client.post 'card/savecomment/' + boardId + '/' + cardId, data, (err, res, body) ->
      parseReplyData err, body, callback

  addCommentByExternalId: (boardId, externalCardId, userId, comment, callback) ->
    data = { PostedById: userId, Text: comment }
    @client.post 'card/savecommentbyexternalid/' + boardId + '/' + encodeURIComponent(externalCardId), data, (err, res, body) ->
      parseReplyData err, body, callback

  getCardHistory: (boardId, cardId, callback) ->
    @client.get 'card/history/' + boardId + '/' + cardId, (err, res, body) ->
      parseReplyData err, body, callback

  searchCards: (boardId, options, callback) ->
    @client.post 'board/' + boardId + '/searchcards', options, (err, res, body) ->
      parseReplyData err, body, callback

  getNewCards: (boardId, callback) ->
    @client.get 'board/' + boardId + '/listnewcards', (err, res, body) ->
      parseReplyData err, body, callback

  deleteCard: (boardId, cardId, callback) ->
    @client.post 'board/' + boardId + '/deletecard/' + cardId, null, (err, res, body) ->
      parseReplyData err, body, callback

  deleteCards: (boardId, cardIds, callback) ->
    @client.post 'board/' + boardId + '/deletecards', cardIds, (err, res, body) ->
      parseReplyData err, body, callback

  getTaskboard: (boardId, cardId, callback) ->
    @client.get 'v1/board/' + boardId + '/card/' + cardId + '/taskboard', (err, res, body) ->
      parseReplyData err, body, callback

  addTask: (boardId, cardId, taskCard, callback) ->
    taskCard.UserWipOverrideComment = defaultWipOverrideReason
    @client.post 'v1/board/' + boardId + '/card/' + cardId + '/tasks/lane/' + taskCard.LaneId + '/position/' + taskCard.Index, taskCard, (err, res, body) ->
      parseReplyData err, body, callback

  updateTask: (boardId, cardId, taskCard, callback) ->
    taskCard.UserWipOverrideComment = defaultWipOverrideReason
    @client.post 'v1/board/' + boardId + '/update/card/' + cardId + '/tasks/' + taskCard.Id, taskCard, (err, res, body) ->
      parseReplyData err, body, callback

  deleteTask: (boardId, cardId, taskId, callback) ->
    @client.post 'v1/board/' + boardId + '/delete/card/' + cardId + '/tasks/' + taskId, null, (err, res, body) ->
      parseReplyData err, body, callback

  getTaskBoardUpdates: (boardId, cardId, version, callback) ->
    @client.get 'v1/board/' + boardId + '/card/' + cardId + '/tasks/boardversion/' + version, (err, res, body) ->
      parseReplyData err, body, callback

  moveTask: (boardId, cardId, taskId, toLaneId, position, callback) ->
    @client.post 'v1/board/' + boardId + '/move/card/' + cardId + '/tasks/' + taskId + '/lane/' + toLaneId + '/position/' + position, null, (err, res, body) ->
      parseReplyData err, body, callback

  getAttachmentCount: (boardId, cardId, callback) ->
    @client.get 'card/GetAttachmentsCount/' + boardId + '/' + cardId, (err, res, body) ->
      parseReplyData err, body, callback

  getAttachments: (boardId, cardId, callback) ->
    @client.get 'card/GetAttachments/' + boardId + '/' + cardId, (err, res, body) ->
      parseReplyData err, body, callback

  getAttachment: (boardId, cardId, attachmentId, callback) ->
    @client.get 'card/GetAttachments/' + boardId + '/' + cardId + '/' + attachmentId, (err, res, body) ->
      parseReplyData err, body, callback

  downloadAttachment: (boardId, attachmentId, filePath, callback) ->
    @client.saveFile 'card/DownloadAttachment/' + boardId + '/' + attachmentId, filePath, (err, res, body) ->
      callback err, body

  deleteAttachment: (boardId, cardId, attachmentId, callback) ->
    @client.post 'card/DeleteAttachment/' + boardId + '/' + cardId + '/' + attachmentId, null, (err, res, body) ->
      parseReplyData err, body, callback

  addAttachment: (boardId, cardId, description, file, callback) ->
    if typeof file is "string"
      fileName = path.basename file
    else
      fileName = path.basename file.path
    attachmentData =
      Id: 0
      Description: description
      FileName: fileName

    @client.sendFile 'card/SaveAttachment/' + boardId + '/' + cardId, file, attachmentData, (err, res, body) ->
      parsed = parseBody body
      parseReplyData err, parsed, callback
