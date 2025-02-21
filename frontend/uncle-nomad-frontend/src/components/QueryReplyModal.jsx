import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog'
import { Textarea } from './ui/textarea'
import { Button } from './ui/button'

const QueryReplyModal = ({isOpen, handleReply, onClose, isLoading, selectedQuery, replyContent, setReplyContent, setSelectedQuery}) => {
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                <DialogTitle>Submit Your Query</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 p-4 border rounded-lg">
                <h3 className="text-lg font-semibold">Reply to {selectedQuery.email}</h3>
                <Textarea
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    placeholder="Type your reply here..."
                    className="min-h-[150px]"
                />
                <div className="flex gap-2">
                    <Button variant='custom' onClick={() => handleReply(selectedQuery)}>
                        {isLoading ? 'sending...' : 'send reply'}
                    </Button>
                    <Button
                    variant="outline"
                    onClick={() => {
                        setSelectedQuery(null);
                        setReplyContent('');
                    }}
                    >
                    Cancel
                    </Button>
                </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
export default QueryReplyModal;