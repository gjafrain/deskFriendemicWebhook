

exports.sendSuccessMessage = (message, res) => {
    res.status(200).send(message)
    return true
}